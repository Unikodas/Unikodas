-- =====================================================================
-- 0007_password_auth.sql
-- Email+password auth on top of the existing synthetic-email pattern.
--
-- Adds:
--   - profiles.has_password         — UI hint, NOT a security check
--   - profiles.password_failed_attempts / password_locked_until
--   - record_password_attempt(user_id, success) — atomic counter+lockout
--   - clear_password_lockout(user_id)            — called on successful OTP
--
-- The actual password storage lives in auth.users.encrypted_password
-- and is managed by Supabase (bcrypt). We do not store password
-- hashes in our own tables.
--
-- Apply via Supabase SQL Editor after 0006.
-- =====================================================================

-- ---------- profile columns ------------------------------------------

alter table public.profiles
  add column if not exists has_password boolean not null default false;

alter table public.profiles
  add column if not exists password_failed_attempts smallint not null default 0;

alter table public.profiles
  add column if not exists password_locked_until timestamptz;

-- ---------- atomic attempt counter + lockout -------------------------
-- Returns the post-update password_locked_until (null if not locked).
-- Calling it for a non-existent user_id is a no-op.
--
-- Threshold and duration are parameterised so the call site can change
-- them without a migration; the route currently passes 5 / 60 (minutes).
--
-- Service role only — the route uses createServiceRoleClient().

create or replace function public.record_password_attempt(
  p_user_id           uuid,
  p_success           boolean,
  p_lockout_threshold int default 5,
  p_lockout_minutes   int default 60
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locked_until timestamptz;
begin
  if p_success then
    update public.profiles
       set password_failed_attempts = 0,
           password_locked_until = null
     where id = p_user_id
    returning password_locked_until into v_locked_until;
    return v_locked_until;
  end if;

  -- Failure path: increment, and lock if over the threshold.
  update public.profiles
     set password_failed_attempts = password_failed_attempts + 1,
         password_locked_until = case
           when password_failed_attempts + 1 >= p_lockout_threshold
             then now() + make_interval(mins => p_lockout_minutes)
           else password_locked_until
         end
   where id = p_user_id
  returning password_locked_until into v_locked_until;

  return v_locked_until;
end;
$$;

revoke all on function public.record_password_attempt(uuid, boolean, int, int)
  from public, anon, authenticated;

-- ---------- clear lockout -------------------------------------------
-- Called from the OTP verify route on successful login. A successful
-- OTP proves phone ownership, which is a stronger signal than a
-- successful password attempt — clearing the lockout lets the user
-- recover their account by going through SMS.

create or replace function public.clear_password_lockout(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set password_failed_attempts = 0,
         password_locked_until = null
   where id = p_user_id;
$$;

revoke all on function public.clear_password_lockout(uuid)
  from public, anon, authenticated;
