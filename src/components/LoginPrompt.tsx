import Link from 'next/link';

type LoginPromptProps = {
  redirectTo?: string;
  className?: string;
};

const bullets = [
  'Rašykite pardavėjams',
  'Išsaugokite patikusius numerius',
  'Įdėkite savo skelbimus',
  'Gaukite pranešimus apie žinutes',
];

function authHref(redirectTo: string | undefined) {
  return redirectTo ? `/prisijungti?redirect=${encodeURIComponent(redirectTo)}` : '/prisijungti';
}

export function LoginPrompt({ redirectTo, className = '' }: LoginPromptProps) {
  const href = authHref(redirectTo);

  return (
    <section className={['app-card p-5 text-[var(--card-foreground)]', className].join(' ')}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:color-mix(in_srgb,var(--primary)_18%,var(--muted))] text-[var(--primary)]">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </div>
      <h2 className="text-xl font-black leading-tight">
        Prisijunkite, kad galėtumėte naudotis visomis Unikodas funkcijomis
      </h2>
      <ul className="mt-4 grid gap-2.5 text-sm font-medium text-[var(--muted-foreground)]">
        {bullets.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]" aria-hidden="true">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href={href} className="app-button-primary px-4 py-3 text-center text-sm">
          Prisijungti
        </Link>
        <Link href={href} className="app-button-secondary px-4 py-3 text-center text-sm">
          Registruotis
        </Link>
      </div>
    </section>
  );
}
