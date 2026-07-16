import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { requireUser } from '@/lib/auth/require-user';
import { DisplayNameForm } from './DisplayNameForm';
import { EmailSettingsForm } from './EmailSettingsForm';
import SignOutButton from './SignOutButton';
import { LogoLink } from '@/components/LogoLink';

type MenuRowProps = {
  label: string;
  href?: string;
  badge?: string;
};

function RowIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--muted)] text-[var(--primary)]">
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden="true">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </span>
  );
}

function ProfileMenuRow({ label, href, badge }: MenuRowProps) {
  const content = (
    <>
      <RowIcon />
      <span className="flex-1 font-bold text-[var(--foreground)]">{label}</span>
      {badge && (
        <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-bold text-[var(--muted-soft)]">
          {badge}
        </span>
      )}
    </>
  );

  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-3 opacity-80">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--muted)]"
    >
      {content}
    </Link>
  );
}

export default async function ProfilePage() {
  const { supabase, user } = await requireUser('/profilis');

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('phone, display_name, has_password, email, email_verified_at, email_notifications_enabled, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr) {
    console.error('[profilis] profile fetch failed:', profileErr);
  }

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/" className="inline-flex min-h-11 min-w-12 items-center justify-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="app-shell mx-auto min-h-screen max-w-2xl space-y-5 px-4 py-5 sm:px-6">
        <section className="app-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(145deg,var(--primary),#0f3f9f)] text-2xl font-black text-white shadow-[0_18px_42px_rgba(47,125,246,0.34)]">
              {(profile?.display_name ?? 'U').slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black text-[var(--foreground)]">
                {profile?.display_name ?? 'Unikodas vartotojas'}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  Patvirtinta SMS
                </span>
                <span className="text-xs font-semibold text-[var(--muted-soft)]">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('lt-LT')
                    : lt.nav.profile}
                </span>
              </div>
            </div>
          </div>

          <dl className="mt-5 rounded-3xl bg-[var(--muted)] p-4">
            <dt className="text-xs font-bold uppercase text-[var(--muted-soft)]">
              {lt.auth.phoneLabel}
            </dt>
            <dd className="mt-1 text-base font-bold text-[var(--foreground)]">
              {profile?.phone ?? '—'}
            </dd>
          </dl>
        </section>

        <section className="grid gap-2">
          <ProfileMenuRow label="Mano skelbimai" badge="Netrukus" />
          <ProfileMenuRow label="Išsaugoti numeriai" badge="Netrukus" />
          <ProfileMenuRow label="Žinutės" href="/zinutes" />
          <ProfileMenuRow label="Pranešimai" href="#pranesimai" />
          <ProfileMenuRow label="Nustatymai" href="#nustatymai" />
          <ProfileMenuRow label="Pagalba ir taisyklės" href="/taisykles" />
        </section>

        <section id="nustatymai" className="app-card space-y-5 p-5">
          <h2 className="text-lg font-black text-[var(--foreground)]">Nustatymai</h2>
          <DisplayNameForm initialDisplayName={profile?.display_name ?? null} />
        </section>

        <section id="pranesimai" className="app-card p-5">
          <EmailSettingsForm
            initialEmail={profile?.email ?? null}
            initialEmailNotificationsEnabled={profile?.email_notifications_enabled ?? true}
            initialEmailVerified={Boolean(profile?.email_verified_at)}
          />
        </section>

        <section className="app-card space-y-3 p-5">
          <h2 className="text-sm font-black text-[var(--foreground)]">{lt.auth.passwordSection}</h2>
          <Link
            href="/nustatyti-slaptazodi"
            className="app-button-secondary inline-flex px-4 py-3 text-sm"
          >
            {profile?.has_password ? lt.auth.changePassword : lt.auth.setPassword}
          </Link>
        </section>

        <SignOutButton />
      </main>
    </>
  );
}
