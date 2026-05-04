import { notFound } from 'next/navigation';
import { requireUser } from './require-user';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Server-only helper for /admin/* routes and admin Server Actions.
 *
 * Returns:
 *   - user:        the signed-in user (with .id, .email, …)
 *   - admin:       a SERVICE-ROLE Supabase client. Bypasses RLS — admin
 *                  reads/writes go through this. Never expose this client
 *                  to the browser.
 *   - userClient:  the cookie-bound client. Useful when an admin action
 *                  also needs to behave-like-a-user (rare).
 *
 * Behavior:
 *   - Not signed in → redirect to /prisijungti?redirect=/admin
 *   - Signed in but not admin → notFound() (404). We deliberately don't
 *     return a 403 because that would confirm /admin/* exists; a 404
 *     keeps the route opaque to non-admins.
 *
 * Safe in: Server Components, Route Handlers, Server Actions.
 * NOT safe in: Client Components.
 */
export async function requireAdmin() {
  const { supabase: userClient, user } = await requireUser('/admin');

  // The user can read their own profile via RLS `profiles_self_read`,
  // so this query stays on the user-bound client.
  const { data: profile, error } = await userClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    notFound();
  }

  const admin = createServiceRoleClient();
  return { user, admin, userClient };
}
