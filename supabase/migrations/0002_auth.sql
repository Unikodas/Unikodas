-- =====================================================================
-- 0002_auth.sql
-- Auth helpers for stub-OTP login flow.
--   - on_auth_user_created trigger: keep public.profiles in sync with auth.users
--   - bump_rate_limit(): atomic upsert+increment+check
--   - verify_otp_code(): atomic OTP verification with attempt accounting
-- Apply via Supabase SQL Editor after 0001.
-- =====================================================================

-- ---------- profile autocreation trigger -----------------------------
-- When the admin API creates an auth.users row with a phone, mirror it
-- into public.profiles so the app has a stable "user identity" row to
-- reference. If the phone is already taken (uniqueness collision in
-- profiles), the insert raises and the auth.users insert rolls back —
-- which is the correct enforcement of "one phone per account".

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.phone is not null then
    insert into public.profiles (id, phone)
    values (new.id, new.phone)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------- atomic rate-limit bumper ---------------------------------
-- Increments the counter in the (bucket, key, window_start) row and
-- returns true if the post-increment count is still <= max. Service
-- role only — RLS blocks direct table access from anon/auth roles.

create or replace function public.bump_rate_limit(
  p_bucket text,
  p_key    text,
  p_window timestamptz,
  p_max    int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.rate_limits (bucket, key, window_start, count)
  values (p_bucket, p_key, p_window, 1)
  on conflict (bucket, key, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

revoke all on function public.bump_rate_limit(text, text, timestamptz, int) from public, anon, authenticated;

-- ---------- atomic OTP verifier --------------------------------------
-- Locks the most recent unconsumed/unexpired OTP for the phone, checks
-- attempt count, compares hash, marks consumed on success, increments
-- attempts on failure. Returns one row:
--   verified  = true if the code matched AND was within attempt budget
--   exhausted = true if the code's attempt budget was already spent
-- Service role only.

create or replace function public.verify_otp_code(
  p_phone        text,
  p_code_hash    text,
  p_max_attempts int default 5
) returns table(verified boolean, exhausted boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id        uuid;
  v_hash      text;
  v_attempts  int;
begin
  select id, code_hash, attempts
    into v_id, v_hash, v_attempts
  from public.otp_codes
   where phone = p_phone
     and consumed_at is null
     and expires_at > now()
   order by created_at desc
   limit 1
   for update;

  if v_id is null then
    -- No live code for this phone (never sent, expired, or already consumed)
    return query select false, false;
    return;
  end if;

  if v_attempts >= p_max_attempts then
    -- Lock the code so further guessing on the same code is futile
    update public.otp_codes set consumed_at = now() where id = v_id;
    return query select false, true;
    return;
  end if;

  if v_hash = p_code_hash then
    update public.otp_codes
       set consumed_at = now(),
           attempts    = attempts + 1
     where id = v_id;
    return query select true, false;
  else
    update public.otp_codes
       set attempts = attempts + 1
     where id = v_id;
    return query select false, false;
  end if;
end;
$$;

revoke all on function public.verify_otp_code(text, text, int) from public, anon, authenticated;
