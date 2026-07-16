-- Refund an OTP rate-limit reservation when the SMS provider fails before
-- accepting the message. Service role only; callers cannot reset limits.
create or replace function public.refund_rate_limit(
  p_bucket text,
  p_key text,
  p_window timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rate_limits
     set count = greatest(count - 1, 0)
   where bucket = p_bucket
     and key = p_key
     and window_start = p_window;

  delete from public.rate_limits
   where bucket = p_bucket
     and key = p_key
     and window_start = p_window
     and count = 0;
end;
$$;

revoke all on function public.refund_rate_limit(text, text, timestamptz)
  from public, anon, authenticated;

