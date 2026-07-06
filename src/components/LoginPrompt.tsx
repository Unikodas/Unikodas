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
    <section
      className={[
        'rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--card-foreground)] shadow-lg shadow-black/10',
        className,
      ].join(' ')}
    >
      <h2 className="text-xl font-semibold leading-tight">
        Prisijunkite, kad galėtumėte naudotis visomis Unikodas funkcijomis
      </h2>
      <ul className="mt-4 grid gap-2 text-sm text-[var(--muted-foreground)]">
        {bullets.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href={href}
          className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)]"
        >
          Prisijungti
        </Link>
        <Link
          href={href}
          className="rounded-2xl border border-[var(--border-strong)] px-4 py-3 text-center text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          Registruotis
        </Link>
      </div>
    </section>
  );
}
