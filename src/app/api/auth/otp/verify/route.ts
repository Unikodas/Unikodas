import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizeLithuanianMobile } from '@/lib/validation/phone';
import { hashOtpCode, OTP_CONSTANTS } from '@/lib/auth/otp';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { getClientIp } from '@/lib/http/ip';
import { mintSessionForVerifiedPhone } from '@/lib/auth/session';
import { createServiceRoleClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  phone: z.string().min(1).max(32),
  code: z.string().regex(/^\d{6}$/, 'code must be 6 digits'),
});

/**
 * Timing-attack mitigation: pad the latency of the three state-revealing
 * outcomes (success, invalid_code, too_many_attempts) so an attacker
 * can't distinguish them by response time alone. Applied AFTER all the
 * real work so it's additive on every path it covers.
 */
const TIMING_PROTECTION_MS = 250;

async function delayForTimingProtection(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, TIMING_PROTECTION_MS));
}

export async function POST(request: NextRequest) {
  // 1. Parse + validate input
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const phone = normalizeLithuanianMobile(parsed.phone);
  if (!phone) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
  }

  const ip = getClientIp(request);

  // 2. Rate-limit verify attempts (separate buckets from request)
  const ipOk = await bumpRateLimit({
    bucket: 'otp_verify_ip',
    key: ip,
    ...RATE_LIMITS.OTP_VERIFY_PER_IP,
  });
  if (!ipOk.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const phoneOk = await bumpRateLimit({
    bucket: 'otp_verify_phone',
    key: phone,
    ...RATE_LIMITS.OTP_VERIFY_PER_PHONE,
  });
  if (!phoneOk.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // 3. Atomic verify in Postgres (locks the candidate code row).
  const codeHash = hashOtpCode(phone, parsed.code);
  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc('verify_otp_code', {
    p_phone: phone,
    p_code_hash: codeHash,
    p_max_attempts: OTP_CONSTANTS.MAX_ATTEMPTS,
  });

  if (error) {
    console.error('[otp/verify] verify_otp_code rpc failed:', error);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // verify_otp_code returns SETOF (verified, exhausted) — take first row
  const row = Array.isArray(data) ? data[0] : data;
  const verified = row?.verified === true;
  const exhausted = row?.exhausted === true;

  // 4a. Failure paths: identical delay so timing doesn't reveal which.
  if (!verified) {
    await delayForTimingProtection();
    return NextResponse.json(
      { error: exhausted ? 'too_many_attempts' : 'invalid_code' },
      { status: 401 },
    );
  }

  // 4b. Success path: mint a session. Errors are logged inside session.ts;
  //     we only return a generic 'session_failed' here to avoid leaking
  //     internal state.
  let userId: string;
  try {
    userId = await mintSessionForVerifiedPhone(phone);
  } catch {
    return NextResponse.json({ error: 'session_failed' }, { status: 500 });
  }

  // A successful OTP login proves phone ownership — stronger than a
  // password attempt — so we clear any active password lockout. Failure
  // here is non-fatal; the OTP login itself already succeeded.
  const { error: clearError } = await admin.rpc('clear_password_lockout', {
    p_user_id: userId,
  });
  if (clearError) {
    console.error('[otp/verify] clear_password_lockout failed:', clearError);
  }

  // Apply the SAME delay on success so latency matches the failure paths.
  await delayForTimingProtection();
  return NextResponse.json({ ok: true });
}
