-- =====================================================================
-- 0008_listing_flag_type.sql
-- Adds the plate-symbol field (Lithuanian flag / EU / Vytis).
--
-- This is a separate attribute from `plate_type` (standard /
-- personalized / historical / other) — plate_type describes the
-- *kind* of plate; flag_type describes the *symbol* printed on it.
--
-- DEFAULT 'eu_symbol' backfills existing rows so the NOT NULL
-- ALTER doesn't fail. Sellers should review their existing listings
-- and adjust if the assumed default is wrong.
--
-- Apply via Supabase SQL Editor after 0007.
-- =====================================================================

alter table public.listings
  add column if not exists flag_type text not null default 'eu_symbol'
    check (flag_type in ('lithuanian_flag', 'eu_symbol', 'vytis'));
