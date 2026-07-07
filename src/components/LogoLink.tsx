import Link from 'next/link';

export function LogoLink() {
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-[var(--foreground)]">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-[0.62rem] font-black tracking-tight text-[var(--primary-foreground)] shadow-sm shadow-blue-500/20"
        aria-hidden="true"
      >
        LT
      </span>
      <span className="text-lg font-black tracking-wide">UNIKODAS</span>
    </Link>
  );
}
