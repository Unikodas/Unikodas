-- =====================================================================
-- 0001_initial_schema.sql
-- Lithuanian Number Plate Marketplace — initial schema
--
-- HOW TO APPLY (MVP, manual):
--   Open Supabase Dashboard → SQL Editor → paste this entire file → Run.
--
-- Idempotent: safe to re-run during early development.
-- =====================================================================

-- ---------- helpers --------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

-- ---------- profiles -------------------------------------------------
-- One row per authenticated user. Phone is the verified identity.

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  phone         text unique not null,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- listings -------------------------------------------------
-- Plates for sale.

create table if not exists public.listings (
  id                   uuid primary key default gen_random_uuid(),
  seller_id            uuid not null references public.profiles(id) on delete cascade,
  plate_text           text not null,
  plate_type           text not null,                  -- e.g. 'standard','vintage','vanity'
                                                       -- allowed values enforced in app layer (Zod);
                                                       -- promote to a check constraint once stable.
  city                 text not null,                  -- Lithuanian city, e.g. 'Vilnius'
  image_url            text,                           -- nullable; populated when seller uploads
  price_eur            integer check (price_eur is null or price_eur >= 0),
  description          text,
  is_verified_listing  boolean not null default false, -- moderator marks true after ownership check
  status               text not null default 'active'
                         check (status in ('active','sold','removed')),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists listings_status_created_idx
  on public.listings (status, created_at desc);
create index if not exists listings_seller_idx
  on public.listings (seller_id);
create index if not exists listings_city_idx
  on public.listings (city);

drop trigger if exists listings_updated_at on public.listings;
create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- ---------- wanted_listings ------------------------------------------
-- Buyers describe what plate they're looking for.

create table if not exists public.wanted_listings (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid not null references public.profiles(id) on delete cascade,
  plate_pattern  text not null,
  max_price_eur  integer check (max_price_eur is null or max_price_eur >= 0),
  description    text,
  status         text not null default 'active'
                   check (status in ('active','closed','removed')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists wanted_status_created_idx
  on public.wanted_listings (status, created_at desc);
create index if not exists wanted_buyer_idx
  on public.wanted_listings (buyer_id);

drop trigger if exists wanted_updated_at on public.wanted_listings;
create trigger wanted_updated_at
  before update on public.wanted_listings
  for each row execute function public.set_updated_at();

-- ---------- messages -------------------------------------------------
-- Direct messages between users about a listing.

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  listing_id    uuid references public.listings(id) on delete set null,
  sender_id     uuid not null references public.profiles(id) on delete cascade,
  recipient_id  uuid not null references public.profiles(id) on delete cascade,
  body          text not null check (char_length(body) between 1 and 2000),
  created_at    timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create index if not exists messages_recipient_idx
  on public.messages (recipient_id, created_at desc);
create index if not exists messages_sender_idx
  on public.messages (sender_id, created_at desc);
create index if not exists messages_listing_idx
  on public.messages (listing_id);

-- ---------- otp_codes ------------------------------------------------
-- Stores hashed OTP codes for phone verification (stub provider for dev).
-- Service role only — never readable from the client.

create table if not exists public.otp_codes (
  id           uuid primary key default gen_random_uuid(),
  phone        text not null,
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     smallint not null default 0,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists otp_phone_created_idx
  on public.otp_codes (phone, created_at desc);

-- ---------- rate_limits ----------------------------------------------
-- Simple time-bucketed counter. Upgrade to Redis later if needed.
-- Service role only.

create table if not exists public.rate_limits (
  bucket        text not null,         -- e.g. 'otp_request_phone', 'msg_send_user'
  key           text not null,         -- the phone / IP / user id
  window_start  timestamptz not null,  -- truncated to a window (e.g. minute / hour)
  count         integer not null default 0,
  primary key (bucket, key, window_start)
);

create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles         enable row level security;
alter table public.listings         enable row level security;
alter table public.wanted_listings  enable row level security;
alter table public.messages         enable row level security;
alter table public.otp_codes        enable row level security;
alter table public.rate_limits      enable row level security;

-- ---------- profiles policies ----------------------------------------
-- The profiles table contains phone numbers and must NEVER be exposed to
-- anyone other than the row owner. Even authenticated users cannot read
-- other users' profile rows directly.
--
-- The ONLY public-facing way to read profile data is the `public_profiles`
-- view defined below, which returns just id + display_name.
--
-- Future phone-reveal flows (e.g. "contact seller") must go through a
-- dedicated server route that uses the service role key, applies rate
-- limiting, and ideally writes an audit row — never a direct table query.

drop policy if exists "profiles_public_read"            on public.profiles;
drop policy if exists "profiles_authenticated_read"     on public.profiles;
drop policy if exists "profiles_self_read"              on public.profiles;
drop policy if exists "profiles_insert_self"            on public.profiles;
drop policy if exists "profiles_update_self"            on public.profiles;

create policy "profiles_self_read"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Safe public view: only id + display_name, no phone or timestamps.
-- Used by the public homepage to show "by <display_name>" on listing cards
-- without leaking phone numbers.
--
-- IMPORTANT: this view intentionally runs as SECURITY DEFINER (the default
-- in PG15+ when `security_invoker` is not set), so it bypasses the RLS on
-- `profiles` and lets anon read display names. It is safe because the view
-- only selects non-sensitive columns. Do NOT add the phone column here.
drop view if exists public.public_profiles;
create view public.public_profiles as
  select id, display_name
  from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- ---------- listings policies ----------------------------------------

drop policy if exists "listings_public_active_read"  on public.listings;
drop policy if exists "listings_owner_read_all"      on public.listings;
drop policy if exists "listings_owner_insert"        on public.listings;
drop policy if exists "listings_owner_update"        on public.listings;
drop policy if exists "listings_owner_delete"        on public.listings;

create policy "listings_public_active_read"
  on public.listings for select
  using (status = 'active');

create policy "listings_owner_read_all"
  on public.listings for select
  using (seller_id = auth.uid());

create policy "listings_owner_insert"
  on public.listings for insert
  with check (seller_id = auth.uid());

create policy "listings_owner_update"
  on public.listings for update
  using (seller_id = auth.uid())
  with check (seller_id = auth.uid());

create policy "listings_owner_delete"
  on public.listings for delete
  using (seller_id = auth.uid());

-- ---------- wanted_listings policies ---------------------------------

drop policy if exists "wanted_public_active_read"  on public.wanted_listings;
drop policy if exists "wanted_owner_read_all"      on public.wanted_listings;
drop policy if exists "wanted_owner_insert"        on public.wanted_listings;
drop policy if exists "wanted_owner_update"        on public.wanted_listings;
drop policy if exists "wanted_owner_delete"        on public.wanted_listings;

create policy "wanted_public_active_read"
  on public.wanted_listings for select
  using (status = 'active');

create policy "wanted_owner_read_all"
  on public.wanted_listings for select
  using (buyer_id = auth.uid());

create policy "wanted_owner_insert"
  on public.wanted_listings for insert
  with check (buyer_id = auth.uid());

create policy "wanted_owner_update"
  on public.wanted_listings for update
  using (buyer_id = auth.uid())
  with check (buyer_id = auth.uid());

create policy "wanted_owner_delete"
  on public.wanted_listings for delete
  using (buyer_id = auth.uid());

-- ---------- messages policies ----------------------------------------
-- Sender or recipient may read; only sender may insert (with their own id).

drop policy if exists "messages_participant_read" on public.messages;
drop policy if exists "messages_sender_insert"    on public.messages;

create policy "messages_participant_read"
  on public.messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "messages_sender_insert"
  on public.messages for insert
  with check (sender_id = auth.uid());

-- ---------- otp_codes & rate_limits ----------------------------------
-- No policies => with RLS enabled, the anon and authenticated roles get
-- zero access. Only the service_role key (used from API routes) can touch
-- these tables. This is intentional.
