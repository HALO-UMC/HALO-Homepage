-- KIRI 사전예약 전용 테이블
-- Supabase SQL Editor에서 실행한 뒤 Vercel 환경변수를 설정합니다.
-- 공개 전 운영 주체·보유 기간·정책 버전을 확정해야 합니다.

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
  privacy_retention_label text not null,
  created_at timestamptz not null default now(),
  constraint kiri_preregistrations_email_normalized_unique unique (email_normalized),
  constraint kiri_preregistrations_email_normalized_check
    check (email_normalized = lower(btrim(email_normalized))),
  constraint kiri_preregistrations_nickname_length_check
    check (nickname is null or char_length(nickname) <= 24)
);

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
