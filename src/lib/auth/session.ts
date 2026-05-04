import {
  createClient as createServerSupabase,
  createServiceRoleClient,
} from '@/lib/supabase/server';

type AdminClient = ReturnType<typeof createServiceRoleClient>;

/**
 * Convert a Lithuanian E.164 phone (+37061234567) into a deterministic,
 * non-routable synthetic email used as the auth.users.email value.
 *
 * Why a synthetic email?
 *   Supabase Auth was originally built around email-based identity.
 *   Its admin API exposes generateLink({type:'magiclink'}) keyed by
 *   email, and we use that to mint sessions for users whose real
 *   identity is a Lithuanian mobile number. The synthetic email lives
 *   only in the database — it's never shown to users, never delivered
 *   to, and never accepted as login input.
 *
 *   The `.local` TLD is non-routable (RFC 6762), so even if a generated
 *   magic-link URL ever leaked into a log, no MTA would deliver mail
 *   to it.
 *
 *   Equally important: the synthetic email is computed here in our
 *   code, deterministically from the phone, with no Supabase-side
 *   normalization in between. That makes it the most reliable handle
 *   for "is there already an auth user for this phone?" — auth.users
 *   may store the phone with or without a leading `+` depending on
 *   Supabase version, but the synthetic email is stable.
 */
export function phoneToSyntheticEmail(phoneE164: string): string {
  // Strip the leading "+" and anything not a digit (defense in depth)
  const digits = phoneE164.replace(/[^\d]/g, '');
  return `lt-${digits}@phone.numeriurinka.local`;
}

/**
 * After a successful OTP verification, ensure the auth user + profile
 * exist for this phone and write a session cookie onto the response.
 *
 * SECURITY GUARANTEES:
 *   - The plaintext OTP, the magic-link token, and the hashed token
 *     are NEVER returned to the client and NEVER logged.
 *   - On any internal failure we log a short stage tag server-side
 *     (e.g. "create_user", "profile_repair") and throw a single
 *     sanitized 'SESSION_MINT_FAILED' upward. The caller turns that
 *     into a uniform HTTP 500 with body { error: 'session_failed' },
 *     so distinct internal failures look identical to the client.
 *
 * ROBUSTNESS NOTES:
 *   - We do NOT trust public.profiles as the "auth user exists" oracle.
 *     Phone-format desync between auth.users and public.profiles (the
 *     trigger copies new.phone, which Supabase may have normalized to
 *     drop the "+") was the root cause of cross-account login failures.
 *   - We drive flow off auth.users via the admin API instead: try
 *     createUser, recover from "already exists" by finding the
 *     existing user via the synthetic email, then upsert the profile
 *     row if it's missing.
 *   - Sign-out before verifyOtp is preserved so cross-account browser
 *     sessions can't leave stale cookies.
 */
export async function mintSessionForVerifiedPhone(phoneE164: string): Promise<string> {
  const admin = createServiceRoleClient();
  const email = phoneToSyntheticEmail(phoneE164);

  try {
    // 1. Find or create the auth user. Canonical source of truth.
    const userId = await findOrCreateAuthUser(admin, email, phoneE164);

    // 2. Make sure the profile row exists. The on_auth_user_created
    //    trigger creates one on createUser, but if that ever failed
    //    silently — or the row was deleted out-of-band — repair here.
    await ensureProfileRow(admin, userId, phoneE164);

    // 3. Generate a one-time magic-link token. The token MUST NOT be
    //    logged or returned anywhere outside this function.
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (linkError || !linkData?.properties?.hashed_token) {
      // linkError.message stays local — the outer catch only logs the stage tag.
      throw new Error(`generate_link: ${linkError?.message ?? 'no_token'}`);
    }

    // 4. Exchange the token via the cookie-bound server client so the
    //    SSR helper writes session cookies onto the response. The
    //    token_hash is passed in memory only and is not logged.
    //
    //    Before exchanging, explicitly sign out any pre-existing
    //    session. Without this, switching accounts in the same browser
    //    (User B signs in over User A's cookies, then A tries to sign
    //    back in) can leave Supabase verifyOtp in an inconsistent
    //    state where the new session doesn't fully replace the old
    //    one. Signing out first makes the cookie state deterministic
    //    across account switches.
    const server = await createServerSupabase();
    await server.auth.signOut();
    const { error: verifyError } = await server.auth.verifyOtp({
      type: 'magiclink',
      token_hash: linkData.properties.hashed_token,
    });
    if (verifyError) {
      throw new Error(`verify_otp: ${verifyError.message}`);
    }

    // Returned so callers can pass it to follow-up admin RPCs (e.g.,
    // clear_password_lockout) without a second profile lookup.
    return userId;
  } catch (err) {
    // SAFE LOGGING:
    //   We only log the stage tag (e.g. "create_user") server-side.
    //   Supabase error objects can include tokens, hashed tokens,
    //   internal IDs, or other sensitive fields, so we never log them
    //   directly. The full message stays inside the inner throws and
    //   is discarded after the stage tag is extracted.
    const message = err instanceof Error ? err.message : 'unknown';
    const stage = message.includes(':') ? message.split(':')[0] : 'unknown';
    console.error('[auth/session] mint failed at stage:', stage);
    throw new Error('SESSION_MINT_FAILED');
  }
}

// ---------------------------------------------------------------------
// internal helpers
// ---------------------------------------------------------------------

/**
 * Try to create the auth user. If an account already exists for this
 * synthetic email / phone, find and return the existing id instead of
 * failing. The synthetic email is the canonical lookup key — it's
 * deterministic from the phone and not subject to Supabase-side
 * formatting changes.
 */
async function findOrCreateAuthUser(
  admin: AdminClient,
  email: string,
  phoneE164: string,
): Promise<string> {
  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      phone: phoneE164,
      email_confirm: true,
      phone_confirm: true,
    });

  // Happy path — fresh user.
  if (created?.user?.id) {
    return created.user.id;
  }

  // "Already exists" — recover by finding the existing user. Supabase's
  // exact error code / message has evolved across versions, so we
  // accept any known "duplicate" signal.
  if (createError && isUserAlreadyExistsError(createError)) {
    const existingId = await findAuthUserIdByEmail(admin, email);
    if (!existingId) {
      throw new Error('find_user: not_found_after_already_exists');
    }
    return existingId;
  }

  // Real, unexpected failure.
  throw new Error(
    `create_user: ${createError?.message ?? 'no_user_returned'}`,
  );
}

/**
 * Heuristic: did createUser fail because the user already exists?
 *
 * We accept several known shapes — supabase-js has shipped at least
 * three different error-code conventions for duplicates over the
 * years, and the human-readable message wording has also drifted.
 */
function isUserAlreadyExistsError(err: {
  code?: string;
  message?: string;
}): boolean {
  const code = (err.code ?? '').toLowerCase();
  const message = (err.message ?? '').toLowerCase();

  if (
    code === 'email_exists' ||
    code === 'phone_exists' ||
    code === 'user_already_exists'
  ) {
    return true;
  }

  if (
    message.includes('already') ||
    message.includes('duplicate') ||
    message.includes('registered')
  ) {
    return true;
  }

  return false;
}

/**
 * Find an auth user by their synthetic email.
 *
 * supabase-js admin doesn't expose a direct get-by-email API, so we
 * paginate listUsers. At MVP scale (a few thousand users at most)
 * this is acceptable. If user counts grow, swap this for a
 * SECURITY DEFINER SQL function that selects from auth.users in one
 * shot — same external contract, faster lookup.
 */
async function findAuthUserIdByEmail(
  admin: AdminClient,
  email: string,
): Promise<string | null> {
  const PER_PAGE = 100;
  const MAX_PAGES = 50; // 5 000 users — generous MVP cap

  for (let page = 1; page <= MAX_PAGES; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error || !data) {
      // Don't include error details in the throw chain — fall through
      // to the null return so the caller produces a sanitized
      // 'find_user: not_found_after_already_exists' instead of
      // exposing list-users internals.
      return null;
    }
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}

/**
 * Ensure a public.profiles row exists for the given auth user.
 *
 * If a row already exists (matched by id) we leave it alone — never
 * overwrite a user's chosen display_name. If no row exists we insert
 * one with a deterministic default name; on the (very rare)
 * display_name unique-collision we retry without one.
 *
 * Phone is stored as we received it (E.164 with the leading "+"). If
 * an older row already had a different phone format, we don't rewrite
 * it — that's an existing-data concern, not a session-mint concern.
 */
async function ensureProfileRow(
  admin: AdminClient,
  userId: string,
  phoneE164: string,
): Promise<void> {
  const { data: existing, error: lookupError } = await admin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (lookupError) {
    throw new Error(`profile_repair: lookup_failed`);
  }
  if (existing) return;

  const defaultName = 'Vartotojas-' + userId.replace(/-/g, '').slice(0, 8);

  // First try: with default display_name.
  const { error: firstError } = await admin.from('profiles').insert({
    id: userId,
    phone: phoneE164,
    display_name: defaultName,
  });
  if (!firstError) return;

  // Postgres unique-violation. Most likely the case-insensitive
  // display_name index. Retry without a display_name; the user can
  // set one via /profilis later.
  if (firstError.code === '23505') {
    const { error: secondError } = await admin.from('profiles').insert({
      id: userId,
      phone: phoneE164,
    });
    if (!secondError) return;

    if (secondError.code === '23505') {
      // Still a unique violation — likely phone or id collision. That
      // means another profile already claims this phone (or id), which
      // is a data-corruption case we can't auto-resolve here.
      throw new Error('profile_repair: id_or_phone_conflict');
    }
    throw new Error(`profile_repair: ${secondError.message}`);
  }

  throw new Error(`profile_repair: ${firstError.message}`);
}
