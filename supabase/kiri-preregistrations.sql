-- KIRI 사전예약 전용 테이블
-- Supabase SQL Editor에서 실행한 뒤 Vercel 환경변수를 설정합니다.
-- 개인정보처리자와 정책 버전은 서버 공통 설정에서 관리합니다.

create extension if not exists pgcrypto;

create table if not exists public.kiri_preregistrations (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  nickname text,
  device text not null check (device in ('android', 'ios', 'both', 'undecided')),
  family_trial boolean not null default false,
  privacy_consent_version text not null,
  privacy_agreed_at timestamptz not null,
  data_controller_name text not null,
  data_controller_representative text not null,
  privacy_retention_label text,
  created_at timestamptz not null default now(),
  constraint kiri_preregistrations_email_normalized_unique unique (email_normalized),
  constraint kiri_preregistrations_email_normalized_check
    check (email_normalized = lower(btrim(email_normalized))),
  constraint kiri_preregistrations_nickname_length_check
    check (nickname is null or char_length(nickname) <= 24)
);

-- Existing installations may already have the table; add the new audit field without
-- altering any existing application records.
alter table public.kiri_preregistrations
  add column if not exists data_controller_representative text;

-- Retention is optional in the current preregistration policy. Keep existing values intact.
alter table public.kiri_preregistrations
  alter column privacy_retention_label drop not null;

alter table public.kiri_preregistrations enable row level security;

revoke all on table public.kiri_preregistrations from public, anon, authenticated;
grant select, insert on table public.kiri_preregistrations to service_role;

comment on table public.kiri_preregistrations is
  'KIRI 출시 알림 사전예약. service_role을 사용하는 서버 API만 접근합니다.';

comment on column public.kiri_preregistrations.email_normalized is
  '서버에서 NFKC 정규화, trim, 소문자 변환한 이메일. 중복 판단 기준.';

comment on column public.kiri_preregistrations.privacy_consent_version is
  '동의 시점에 적용된 사전예약 개인정보 안내 버전.';

comment on column public.kiri_preregistrations.privacy_retention_label is
  '동의 화면에 고지된 보유 기간 문구.';

comment on column public.kiri_preregistrations.data_controller_representative is
  '동의 화면에 고지된 개인정보처리자 대표자.';
