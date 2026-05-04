-- =====================================================================
-- 0003_wanted_indexes.sql
-- Substring-search indexes for wanted_listings.
--
-- The browse query for /ieskau runs:
--   plate_pattern ILIKE '%X%' OR description ILIKE '%X%'
--
-- Plain btree indexes don't help "%X%" patterns — they only support
-- prefix matches. The right tool is pg_trgm (trigram) + GIN, which
-- accelerates arbitrary substring ILIKE/LIKE searches.
--
-- Apply via Supabase SQL Editor after 0002.
-- =====================================================================

create extension if not exists pg_trgm;

create index if not exists wanted_plate_pattern_trgm_idx
  on public.wanted_listings using gin (plate_pattern gin_trgm_ops);

create index if not exists wanted_description_trgm_idx
  on public.wanted_listings using gin (description gin_trgm_ops);
