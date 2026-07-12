-- =====================================================================
-- 0010_profile_email_notifications.sql
-- Optional email notification preferences for direct messages.
--
-- Email remains separate from authentication. Phone is still the login
-- identity; this email is only used for transactional notifications.
--
-- Apply via Supabase SQL Editor after 0009.
-- =====================================================================

alter table public.profiles
  add column if not exists email text;

alter table public.profiles
  add column if not exists email_notifications_enabled boolean not null default true;

