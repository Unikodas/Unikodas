-- =====================================================================
-- 0006_data_integrity.sql
-- Tighten data integrity:
--   - Unique display_name (case-insensitive)
--   - Auto-generated default display name on user creation
--   - listings.price_eur required (NOT NULL)
--
-- Apply via Supabase SQL Editor after 0005.
-- =====================================================================

-- ---------- backfill existing NULL display_names ---------------------
-- Default shape: "Vartotojas-XXXXXXXX" using the first 8 hex chars of
-- the user's UUID. ~4B combinations — collision risk is negligible at
-- MVP scale.

update public.profiles
   set display_name = 'Vartotojas-' || substring(replace(id::text, '-', '') from 1 for 8)
 where display_name is null;

-- ---------- unique display_name (case-insensitive) -------------------
-- Multiple users with the same name (case-insensitive) would let one
-- impersonate the other. Block at the DB level.
--
-- The partial index lets NULL display_names coexist (defense in depth
-- if a row somehow ends up with NULL despite the trigger).

create unique index if not exists profiles_display_name_unique_idx
  on public.profiles (lower(display_name))
  where display_name is not null;

-- ---------- update profile autocreation trigger ----------------------
-- New users get a default display name so listing cards / inbox never
-- show "Vartotojas". The trigger pre-checks for the (vanishingly rare)
-- case where the generated default already exists; if it does, the
-- profile is created without a display_name and the user can set one
-- manually via /profilis.
--
-- This avoids the trigger ever raising on the unique-display-name
-- constraint, which would roll back the underlying auth.users insert
-- and break login for that phone.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_default_name text;
begin
  if new.phone is null then
    return new;
  end if;

  v_default_name := 'Vartotojas-' || substring(replace(new.id::text, '-', '') from 1 for 8);

  -- Pre-check: would the default collide with an existing display_name?
  if exists (
    select 1 from public.profiles
     where display_name is not null
       and lower(display_name) = lower(v_default_name)
  ) then
    -- Skip default name. Profile is still created so login succeeds.
    insert into public.profiles (id, phone)
    values (new.id, new.phone)
    on conflict (id) do nothing;
  else
    insert into public.profiles (id, phone, display_name)
    values (new.id, new.phone, v_default_name)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- ---------- listings.price_eur required ------------------------------
-- "Kaina sutartinė" (negotiable) is no longer permitted — every listing
-- must declare a price. We backfill existing NULLs to 0 so the
-- ALTER ... SET NOT NULL succeeds; sellers should review and update.

update public.listings set price_eur = 0 where price_eur is null;
alter table public.listings alter column price_eur set not null;
