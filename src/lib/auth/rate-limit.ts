import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Bump a rate-limit counter and return whether the request is still
 * within budget. Buckets are time-windowed; we round `now` down to the
 * start of the window so all requests in the same window share a row.
 *
 * Atomicity is provided by the `bump_rate_limit` Postgres function
 * (see migration 0002), which uses ON CONFLICT to make the increment
 * race-free.
 */
export async function bumpRateLimit(args: {
  bucket: string;
  key: string;
  /** Window length in milliseconds (e.g. 60 * 60 * 1000 for 1h). */
  windowMs: number;
  /** Maximum allowed requests per window. */
  max: number;
}): Promise<{ allowed: boolean }> {
  const { bucket, key, windowMs, max } = args;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc('bump_rate_limit', {
    p_bucket: bucket,
    p_key: key,
    p_window: windowStart.toISOString(),
    p_max: max,
  });

  if (error) {
    // Fail closed prevents abuse if rate limiting breaks: if the DB call
    // errors we refuse the request rather than letting an attacker flood us.
    console.error('[rate-limit] bump_rate_limit failed:', error);
    return { allowed: false };
  }

  return { allowed: data === true };
}

export async function refundRateLimit(args: {
  bucket: string;
  key: string;
  windowMs: number;
}): Promise<void> {
  const { bucket, key, windowMs } = args;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);
  const admin = createServiceRoleClient();
  const { error } = await admin.rpc('refund_rate_limit', {
    p_bucket: bucket,
    p_key: key,
    p_window: windowStart.toISOString(),
  });

  if (error) {
    console.error('[rate-limit] refund_rate_limit failed:', error);
  }
}

/**
 * Rate-limit budgets used by the auth flow. Keep them here so they're
 * easy to find and tune.
 */
export const RATE_LIMITS = {
  /**
   * Short cooldown: at most 1 OTP request per phone per 30 seconds.
   * Checked BEFORE the hourly limits so users can't trigger a flurry
   * of resends in quick succession even when their hourly budget allows.
   */
  OTP_REQUEST_COOLDOWN_PHONE: { windowMs: 30 * 1000, max: 1 },

  OTP_REQUEST_PER_PHONE: { windowMs: 60 * 60 * 1000, max: 3 },   // 3/hour
  OTP_REQUEST_PER_IP:    { windowMs: 60 * 60 * 1000, max: 5 },   // 5/hour
  OTP_VERIFY_PER_PHONE:  { windowMs: 15 * 60 * 1000, max: 10 },  // 10/15min
  OTP_VERIFY_PER_IP:     { windowMs: 15 * 60 * 1000, max: 20 },  // 20/15min

  /** Outbound direct messages, per signed-in user. */
  MSG_SEND_PER_USER:     { windowMs: 60 * 60 * 1000, max: 20 },  // 20/hour

  /** Abuse reports submitted, per signed-in user. */
  REPORT_PER_USER:       { windowMs: 60 * 60 * 1000, max: 10 },  // 10/hour

  /** Password sign-in attempts. Lockout (5 failures → 1h) is the
   *  per-account control; these are the per-key DoS controls. */
  PASSWORD_ATTEMPT_PER_PHONE: { windowMs: 15 * 60 * 1000, max: 5 },   // 5/15min
  PASSWORD_ATTEMPT_PER_IP:    { windowMs: 15 * 60 * 1000, max: 20 },  // 20/15min

  /** Password set/change ops. Stops a stolen session from cycling
   *  through password changes. */
  PASSWORD_SET_PER_USER:      { windowMs: 60 * 60 * 1000, max: 3 },   // 3/hour
} as const;
