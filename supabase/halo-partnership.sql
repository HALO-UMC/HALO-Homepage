-- Review the existing project's schema before running. Plain CREATE intentionally
-- stops on a name collision and rolls back the transaction.
-- Run once as the project owner in the existing project's SQL Editor.
-- Privilege changes below target only the newly created objects.
begin;

-- PostgREST resolves RPCs by argument names. Reject existing overloads too.
do $$
begin
  if exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('halo_submit_partnership_inquiry', 'halo_purge_expired_partnership_data')
  ) then
    raise exception 'A HALO partnership function already exists in public; review the existing definition before applying this migration.';
  end if;
end;
$$;

create table public.halo_partners (
  slug text primary key,
  name text not null,
  field text not null,
  status text not null check (status in ('proposed', 'discussing', 'mou', 'developing', 'operating')),
  content jsonb not null default '{}',
  published boolean not null default false
);

create table public.halo_company_milestones (
  id uuid primary key default gen_random_uuid(),
  milestone_month date not null check (extract(day from milestone_month) = 1),
  title text not null,
  description text not null,
  image_path text,
  evidence_url text,
  published boolean not null default false
);

create table public.halo_partner_programs (
  id uuid primary key default gen_random_uuid(),
  partner_slug text not null references public.halo_partners(slug),
  title text not null,
  details jsonb not null default '{}',
  published boolean not null default false
);

create table public.halo_program_applications (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.halo_partner_programs(id),
  details jsonb not null,
  policy_version text not null,
  agreed_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.halo_partnership_inquiries (
  id uuid primary key,
  details jsonb not null,
  status text not null default 'received' check (status in ('received', 'reviewing', 'contacted', 'closed')),
  policy_version text not null,
  privacy_agreed_at timestamptz not null default now(),
  privacy_policy_acknowledged_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.halo_partnership_rate_events (
  id uuid primary key,
  ip_digest text not null,
  email_digest text not null, -- HMAC of email or phone; no plaintext contact data
  created_at timestamptz not null default now()
);

create index on public.halo_partnership_rate_events (ip_digest, created_at);
create index on public.halo_partnership_rate_events (email_digest, created_at);
create index on public.halo_partnership_rate_events (created_at);
create index on public.halo_partnership_inquiries (expires_at);

alter table public.halo_partners enable row level security;
alter table public.halo_company_milestones enable row level security;
alter table public.halo_partner_programs enable row level security;
alter table public.halo_program_applications enable row level security;
alter table public.halo_partnership_inquiries enable row level security;
alter table public.halo_partnership_rate_events enable row level security;

revoke all on public.halo_partners, public.halo_company_milestones,
  public.halo_partner_programs, public.halo_program_applications,
  public.halo_partnership_inquiries, public.halo_partnership_rate_events
  from public, anon, authenticated, service_role;
-- Status probe only. Existing admin tables and roles keep their grants.
-- Reading inquiry details from a separate admin app requires its own scoped grant.
grant select (id) on public.halo_partnership_inquiries to service_role;

create function public.halo_submit_partnership_inquiry(
  inquiry_id uuid, inquiry_data jsonb, policy_version text, retention_days integer,
  ip_key text, email_key text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.halo_partnership_inquiries%rowtype;
begin
  -- Serialize retries and shared quota checks across concurrent server instances.
  perform pg_catalog.pg_advisory_xact_lock(41021, pg_catalog.hashtext(inquiry_id::text));
  select * into existing from public.halo_partnership_inquiries where id = inquiry_id;
  if found then
    if existing.details = inquiry_data and existing.policy_version = halo_submit_partnership_inquiry.policy_version then
      return 'duplicate';
    end if;
    return 'conflict';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(41022, pg_catalog.hashtext(ip_key));
  perform pg_catalog.pg_advisory_xact_lock(41023, pg_catalog.hashtext(email_key));
  if (select count(*) from public.halo_partnership_rate_events
      where ip_digest = ip_key and created_at > now() - interval '1 hour') >= 5
    or (select count(*) from public.halo_partnership_rate_events
      where email_digest = email_key and created_at > now() - interval '1 day') >= 3 then
    return 'limited';
  end if;

  insert into public.halo_partnership_inquiries (id, details, policy_version, expires_at)
  values (inquiry_id, inquiry_data, halo_submit_partnership_inquiry.policy_version, now() + retention_days * interval '1 day');
  insert into public.halo_partnership_rate_events (id, ip_digest, email_digest)
  values (inquiry_id, ip_key, email_key);
  return 'created';
end;
$$;

revoke all on function public.halo_submit_partnership_inquiry(uuid, jsonb, text, integer, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.halo_submit_partnership_inquiry(uuid, jsonb, text, integer, text, text) to service_role;

create function public.halo_purge_expired_partnership_data() returns void
language sql
set search_path = ''
as $$
  delete from public.halo_partnership_rate_events where created_at <= now() - interval '1 day';
  delete from public.halo_partnership_inquiries where expires_at <= now();
$$;
revoke all on function public.halo_purge_expired_partnership_data() from public, anon, authenticated, service_role;

notify pgrst, 'reload schema';

commit;
