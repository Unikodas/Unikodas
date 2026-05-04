import { createClient } from '@supabase/supabase-js';
import { phoneToSyntheticEmail } from './session';
import { normalizeLithuanianMobile } from '@/lib/validation/phone';

/**
 * Verify a user's current password without affecting the cookie-bound
 * session. Used as the "reauthentication" gate before changing password.
 *
 * We create a fresh, ephemeral Supabase client (no cookie binding,
 * persistSession=false) and attempt signInWithPassword. If it succeeds
 * we know the user knows the password; we discard the resulting
 * session, which lives only in the ephemeral client's memory.
 *
 * Phone normalization:
 *   profiles.phone may be stored with or without the leading "+" —
 *   Supabase Auth has historically normalized phones differently
 *   across versions, and the trigger that populates profiles copies
 *   whatever auth.users.phone happens to contain. We always run the
 *   stored value through normalizeLithuanianMobile before computing
 *   the synthetic email, which keeps the email stable regardless of
 *   which form is on disk. If normalization fails (e.g., a malformed
 *   row from a buggy migration), we treat reauth as failed rather
 *   than feed garbage into phoneToSyntheticEmail.
 *
 * Returns true on a valid current password, false otherwise. Never
 * throws — call sites can treat false as "wrong password".
 */
export async function verifyCurrentPassword(
  phoneE164: string,
  currentPassword: string,
): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const normalized = normalizeLithuanianMobile(phoneE164);
  if (!normalized) return false;

  const ephemeral = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const email = phoneToSyntheticEmail(normalized);
  const { error } = await ephemeral.auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  return !error;
}
