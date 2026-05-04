import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { PasswordSchema, PASSWORD_MAX } from '@/lib/validation/password';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { verifyCurrentPassword } from '@/lib/auth/password-reauth';
import { createServiceRoleClient } from '@/lib/supabase/server';

const BodySchema = z.object({
  /** Required only when the user already has a password set. */
  current_password: z.string().max(PASSWORD_MAX).optional(),
  new_password: z.string().min(1).max(PASSWORD_MAX),
});

/**
 * Set or change the signed-in user's password.
 *
 * Defense in depth:
 *   - requireUser() — must be signed in.
 *   - Reauthentication: if profiles.has_password is already true, the
 *     caller must supply the current password. We verify it via a
 *     fresh, ephemeral Supabase client (no cookie binding) so a
 *     stolen session cookie alone can't change the password.
 *   - PasswordSchema enforces 10..128 length.
 *   - Rate limit: 3 set/change ops per user per hour.
 *   - The actual update goes through the admin API
 *     (admin.auth.admin.updateUserById) — Supabase manages the
 *     bcrypt hash; we never see the password again.
 *   - We flip profiles.has_password = true and clear any active
 *     lockout (a successful change is itself proof of identity).
 */
export async function POST(request: NextRequest) {
  const { user, supabase } = await requireUser();

  let parsed;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  // Validate the new password against the canonical schema.
  let newPassword: string;
  try {
    newPassword = PasswordSchema.parse(parsed.new_password);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? 'validation_error' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'validation_error' }, { status: 400 });
  }

  // Rate-limit set/change operations.
  const ok = await bumpRateLimit({
    bucket: 'password_set_user',
    key: user.id,
    ...RATE_LIMITS.PASSWORD_SET_PER_USER,
  });
  if (!ok.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  // Look up has_password + phone via the user-bound client (allowed
  // by profiles_self_read).
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('phone, has_password')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('[password/set] profile lookup failed:', profileError);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // Reauthentication gate: if a password is already set, the caller
  // must prove they know it before changing it.
  if (profile.has_password) {
    if (!parsed.current_password) {
      return NextResponse.json(
        { error: 'current_password_required' },
        { status: 400 },
      );
    }
    const reauthOk = await verifyCurrentPassword(profile.phone, parsed.current_password);
    if (!reauthOk) {
      return NextResponse.json(
        { error: 'current_password_wrong' },
        { status: 401 },
      );
    }
  }

  // Update the password via the admin API. Supabase handles bcrypt;
  // we never store hashes in our own tables.
  const admin = createServiceRoleClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updateError) {
    console.error('[password/set] updateUserById failed:', updateError);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // First-time set: flip the flag.
  if (!profile.has_password) {
    const { error: flagError } = await supabase
      .from('profiles')
      .update({ has_password: true })
      .eq('id', user.id);
    if (flagError) {
      console.error('[password/set] has_password update failed:', flagError);
      // Non-fatal — the password is set; UI flag will catch up next read.
    }
  }

  // Clear any active lockout — a successful authenticated password
  // change is itself proof of identity.
  await admin.rpc('clear_password_lockout', { p_user_id: user.id });

  return NextResponse.json({ ok: true });
}
