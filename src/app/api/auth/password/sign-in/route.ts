import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { normalizeLithuanianMobile } from '@/lib/validation/phone';
import { PASSWORD_MAX } from '@/lib/validation/password';
import { phoneToSyntheticEmail } from '@/lib/auth/session';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { getClientIp } from '@/lib/http/ip';
import { getCaptchaProvider } from '@/lib/captcha/provider';
import {
  createClient as createServerSupabase,
  createServiceRoleClient,
} from '@/lib/supabase/server';

/**
 * Timing-attack mitigation: pad latency for state-revealing outcomes
 * (success / wrong password / phone not registered) so an attacker
 * can't distinguish them by response time alone.
 */
const TIMING_PROTECTION_MS = 250;

async function delayForTimingProtection(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, TIMING_PROTECTION_MS));
}

const BodySchema = z.object({
  phone: z.string().min(1).max(32),
  password: z.string().min(1).max(PASSWORD_MAX),
  captcha_token: z.string().max(4096).optional(),
});

export async function POST(request: NextRequest) {
  // 1. Parse + validate input. Note: we do NOT validate password
  //    against PasswordSchema's min length here — that would let an
  //    attacker probe whether a phone has a password set by sending
  //    a 1-char value (different timing if password length is checked
  //    before the auth call). Pass the password through to Supabase
  //    and let it fail uniformly with the credential check.
  let parsed;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const phone = normalizeLithuanianMobile(parsed.phone);
  if (!phone) {
    // Don't reveal that the phone format was the problem.
    await delayForTimingProtection();
    return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  const ip = getClientIp(request);

  // 2. CAPTCHA before any DB work. A bot that fails the challenge
  //    never touches our DB or rate-limit counters.
  try {
    const captchaOk = await getCaptchaProvider().verifyToken(
      parsed.captcha_token ?? '',
      ip,
    );
    if (!captchaOk) {
      return NextResponse.json({ error: 'captcha_failed' }, { status: 400 });
    }
  } catch (err) {
    console.error('[password/sign-in] captcha error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // 3. Rate limits. IP first (cross-phone botnet), then phone
  //    (per-account credential-stuffing).
  const ipOk = await bumpRateLimit({
    bucket: 'password_attempt_ip',
    key: ip,
    ...RATE_LIMITS.PASSWORD_ATTEMPT_PER_IP,
  });
  if (!ipOk.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  const phoneRateOk = await bumpRateLimit({
    bucket: 'password_attempt_phone',
    key: phone,
    ...RATE_LIMITS.PASSWORD_ATTEMPT_PER_PHONE,
  });
  if (!phoneRateOk.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // 4. Look up profile by phone for the lockout state. We accept
  //    both formats (with/without leading "+") because legacy rows
  //    may have either depending on when they were created.
  const admin = createServiceRoleClient();
  const phoneNoPlus = phone.replace(/^\+/, '');
  const { data: profileRows } = await admin
    .from('profiles')
    .select('id, password_locked_until')
    .in('phone', [phone, phoneNoPlus])
    .limit(1);
  const profile = profileRows?.[0] ?? null;

  // 5. Lockout check. The locked response is distinct from generic
  //    invalid_credentials because by the time an account is locked,
  //    the attacker has already done 5+ failed attempts and knows
  //    the phone exists — the hint to use OTP reveals nothing new
  //    and helps the legit user recover.
  if (profile?.password_locked_until) {
    const lockedUntil = new Date(profile.password_locked_until);
    if (lockedUntil > new Date()) {
      await delayForTimingProtection();
      return NextResponse.json({ error: 'account_locked' }, { status: 423 });
    }
  }

  // 6. Sign in. Sign out first so cookie state is deterministic
  //    across account switches in the same browser (same fix as
  //    mintSessionForVerifiedPhone).
  const server = await createServerSupabase();
  await server.auth.signOut();
  const { error: signInError } = await server.auth.signInWithPassword({
    email: phoneToSyntheticEmail(phone),
    password: parsed.password,
  });

  // 7. Record outcome to the per-user lockout counter (only if we
  //    found the profile — non-existent phones rely on the per-phone
  //    rate limit for protection).
  if (profile?.id) {
    const { error: recordError } = await admin.rpc('record_password_attempt', {
      p_user_id: profile.id,
      p_success: !signInError,
    });
    if (recordError) {
      console.error('[password/sign-in] record_password_attempt failed:', recordError);
      // Non-fatal — we still return based on the actual auth outcome.
    }
  }

  // 8. Pad timing for both success and failure paths so an attacker
  //    can't distinguish "wrong password" vs "phone not registered"
  //    vs "valid credentials" by latency.
  await delayForTimingProtection();

  if (signInError) {
    return NextResponse.json(
      { error: 'invalid_credentials' },
      { status: 401 },
    );
  }
  return NextResponse.json({ ok: true });
}
