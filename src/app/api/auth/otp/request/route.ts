import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizeLithuanianMobile } from '@/lib/validation/phone';
import { generateOtpCode, hashOtpCode, OTP_CONSTANTS } from '@/lib/auth/otp';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { getClientIp } from '@/lib/http/ip';
import { getSmsProvider } from '@/lib/sms/provider';
import { getCaptchaProvider } from '@/lib/captcha/provider';
import { createServiceRoleClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  phone: z.string().min(1).max(32),
  /**
   * CAPTCHA token from the browser widget. In dev (CAPTCHA_DEV_MODE=true)
   * the stub provider accepts any value, including empty. In production
   * the real provider rejects missing/invalid tokens.
   */
  captcha_token: z.string().max(4096).optional(),
});

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
  const isLocalOtpDev =
    process.env.NODE_ENV === 'development' &&
    process.env.SMS_PROVIDER === 'stub' &&
    process.env.OTP_DEV_MODE === 'true';

  // 2. Verify CAPTCHA before any DB calls. A bot that fails the
  //    challenge never touches our DB or rate-limit counters. The stub
  //    provider accepts any token in dev (CAPTCHA_DEV_MODE=true) so
  //    local development isn't gated.
  try {
    const captchaOk = await getCaptchaProvider().verifyToken(
      parsed.captcha_token ?? '',
      ip,
    );
    if (!captchaOk) {
      return NextResponse.json({ error: 'captcha_failed' }, { status: 400 });
    }
  } catch (err) {
    console.error('[otp/request] captcha verification error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // 3. Phone cooldown (≤1 request per 30s).
  //    Short-circuits "spam resend" attempts before any other work.
  const cooldownOk = isLocalOtpDev ? { allowed: true } : await bumpRateLimit({
    bucket: 'otp_request_cooldown_phone',
    key: phone,
    ...RATE_LIMITS.OTP_REQUEST_COOLDOWN_PHONE,
  });
  if (!cooldownOk.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // 4. Hourly IP limit.
  const ipOk = isLocalOtpDev ? { allowed: true } : await bumpRateLimit({
    bucket: 'otp_request_ip',
    key: ip,
    ...RATE_LIMITS.OTP_REQUEST_PER_IP,
  });
  if (!ipOk.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // 5. Hourly phone limit.
  const phoneOk = isLocalOtpDev ? { allowed: true } : await bumpRateLimit({
    bucket: 'otp_request_phone',
    key: phone,
    ...RATE_LIMITS.OTP_REQUEST_PER_PHONE,
  });
  if (!phoneOk.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const admin = createServiceRoleClient();

  // 6. Invalidate every previous live code for this phone, so only the
  //    newest code is ever valid. The 30s cooldown above prevents
  //    racy concurrent requests in normal use; even if two codes briefly
  //    coexist, verify_otp_code() picks only the most recent one.
  const { error: invalidateError } = await admin
    .from('otp_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('phone', phone)
    .is('consumed_at', null);
  if (invalidateError) {
    console.error('[otp/request] invalidate previous failed:', invalidateError);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // 7. Generate + store the hashed code.
  //    The plaintext code is held only in this function's scope; it is
  //    never returned to the client, never persisted unhashed, and
  //    never logged outside the dev-only stub provider.
  const code = generateOtpCode();
  const codeHash = hashOtpCode(phone, code);
  const expiresAt = new Date(Date.now() + OTP_CONSTANTS.TTL_MS);

  const { error: insertError } = await admin.from('otp_codes').insert({
    phone,
    code_hash: codeHash,
    expires_at: expiresAt.toISOString(),
  });
  if (insertError) {
    console.error('[otp/request] insert failed:', insertError);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // 8. Hand off to the SMS provider. The stub provider refuses to
  //    operate unless OTP_DEV_MODE=true and only prints to the server
  //    console — it never persists or transmits the code anywhere else.
  try {
    await getSmsProvider().sendOtp(phone, code);
  } catch (err) {
    console.error('[otp/request] sms send failed:', err);
    return NextResponse.json({ error: 'sms_failed' }, { status: 502 });
  }

  // Uniform success response — never leaks whether the phone is registered.
  if (isLocalOtpDev) {
    return NextResponse.json({ ok: true, dev_code: code });
  }

  return NextResponse.json({ ok: true });
}
