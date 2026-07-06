'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: ReactNode;
  primary?: boolean;
};

function Icon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const items: NavItem[] = [
  {
    href: '/',
    label: 'Pagrindinis',
    match: (pathname) => pathname === '/',
    icon: (
      <Icon>
        <path d="M3 11 12 4l9 7" />
        <path d="M5 10v10h14V10" />
      </Icon>
    ),
  },
  {
    href: '/#paieska',
    label: 'Paieška',
    match: () => false,
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </Icon>
    ),
  },
  {
    href: '/parduoti',
    label: 'Įdėti',
    primary: true,
    match: (pathname) => pathname.startsWith('/parduoti'),
    icon: (
      <Icon>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </Icon>
    ),
  },
  {
    href: '/zinutes',
    label: 'Žinutės',
    match: (pathname) => pathname.startsWith('/zinutes'),
    icon: (
      <Icon>
        <path d="M4 5h16v11H8l-4 4V5z" />
        <path d="M8 9h8" />
        <path d="M8 12h5" />
      </Icon>
    ),
  },
  {
    href: '/profilis',
    label: 'Profilis',
    match: (pathname) => pathname.startsWith('/profilis') || pathname.startsWith('/prisijungti'),
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </Icon>
    ),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_92%,transparent)] px-3 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-2xl shadow-black/20 backdrop-blur sm:hidden"
      aria-label="Pagrindinė mobilioji navigacija"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1">
        {items.map((item) => {
          const active = item.match(pathname);
          if (item.primary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-1 text-[0.68rem] font-semibold text-[var(--primary)]"
              >
                <span className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] shadow-lg shadow-blue-500/30 ring-4 ring-[var(--background)]">
                  {item.icon}
                </span>
                <span className="-mt-3">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[0.68rem] font-medium transition',
                active
                  ? 'bg-[var(--muted)] text-[var(--primary)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
