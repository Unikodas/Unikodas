import Link from 'next/link';

export function LogoLink() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-[var(--foreground)]">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--primary)] text-[0.62rem] font-bold tracking-tight text-[var(--primary-foreground)]"
        aria-hidden="true"
      >
        LT
      </span>
      <span className="text-lg font-bold tracking-[0.04em]">UNIKODAS</span>
    </Link>
  );
}
