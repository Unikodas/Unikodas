import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from './redirect-path';

// Re-export so callers can do `import { requireUser, safeRedirectPath }
// from '@/lib/auth/require-user'` if they're already in server-only code.
// Client Components MUST import safeRedirectPath directly from
// './redirect-path' to avoid pulling in next/headers via this file.
export { safeRedirectPath };

/**
 * Server-only helper: returns the current user + bound Supabase client,
 * or redirects to /prisijungti if the visitor isn't signed in.
 *
 * Pass the current path as `redirectTo` so the sign-in page can bring
 * the user back here after successful verification — preserving form
 * intent across the auth detour. The redirect is validated via
 * safeRedirectPath() so a malicious referrer can't trick us into
 * forwarding the user to a third-party host.
 *
 * Today, "verified" == "completed phone OTP" — there is only one tier.
 *
 * Safe in: Server Components, Route Handlers, Server Actions.
 * NOT safe in: Client Components.
 */
export async function requireUser(redirectTo?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    const safe = safeRedirectPath(redirectTo);
    const target = safe
      ? `/prisijungti?redirect=${encodeURIComponent(safe)}`
      : '/prisijungti';
    redirect(target);
  }

  // Defensive runtime assertion — redirect() returns `never`, so this
  // is unreachable under normal flow.
  if (!data.user) {
    throw new Error('requireUser: unreachable — redirect did not throw');
  }

  return { supabase, user: data.user };
}
