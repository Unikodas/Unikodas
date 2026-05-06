import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { DisplayNameForm } from './DisplayNameForm';
import SignOutButton from './SignOutButton';

/**
 * Authenticated profile page. Three sections, top to bottom:
 *   1. Phone (read-only — anchored identity, only the user can see it)
 *   2. Display name editor (visible to other users via public_profiles)
 *   3. Sign out
 *
 * Phone fetch relies on `profiles_self_read` RLS, which limits SELECT
 * on profiles to `auth.uid() = id` — no other user can read this row.
 */
export default async function ProfilePage() {
  const { supabase, user } = await requireUser('/profilis');

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('phone, display_name, has_password, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr) {
    console.error('[profilis] profile fetch failed:', profileErr);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <h1 className="text-2xl font-semibold">{lt.nav.profile}</h1>

        <div className="grid gap-2">
          <Link
            href="/"
            className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
          >
            {lt.profile.navigation.browseListings}
          </Link>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link
              href="/parduoti"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {lt.profile.navigation.sellPlate}
            </Link>
            <Link
              href="/ieskau/naujas"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {lt.profile.navigation.wantedPlate}
            </Link>
          </div>
        </div>

        <dl className="space-y-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-slate-500">
              {lt.auth.phoneLabel}
            </dt>
            <dd className="text-base font-medium">{profile?.phone ?? '—'}</dd>
          </div>
        </dl>

        <div className="border-t border-slate-200 pt-6">
          <DisplayNameForm initialDisplayName={profile?.display_name ?? null} />
        </div>

        <div className="border-t border-slate-200 pt-6 space-y-2">
          <h2 className="text-sm font-medium">{lt.auth.passwordSection}</h2>
          <Link
            href="/nustatyti-slaptazodi"
            className="inline-block rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {profile?.has_password ? lt.auth.changePassword : lt.auth.setPassword}
          </Link>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
