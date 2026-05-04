import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Bound to the request cookies so the user's session is preserved.
 *
 * NOTE: This uses the public anon key + RLS, which is the correct, safe default
 * for user-scoped reads/writes. For admin operations that must bypass RLS,
 * use `createServiceRoleClient()` below — and only call it from server code.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
}

/**
 * Supabase admin client. Bypasses RLS — use ONLY on the server, only when
 * absolutely necessary (e.g. writing to `otp_codes` or `rate_limits`).
 *
 * SECURITY WARNING:
 *   DO NOT import into client-side code — exposes admin privileges.
 *   Only safe inside Route Handlers, Server Actions, and other
 *   server-only modules. The service role key MUST stay in server env
 *   (`SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_` prefix) so Next.js
 *   never bundles it into the browser.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase service role configuration.');
  }
  // Re-using createServerClient with the service key but no cookie binding —
  // we don't want the admin client to read user cookies.
  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        /* no-op */
      },
    },
  });
}
