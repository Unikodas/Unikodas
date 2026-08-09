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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--card)] px-2 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-1.5 sm:hidden"
      aria-label="Pagrindinė mobilioji navigacija"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-h-[3.65rem] flex-col items-center justify-center gap-1 rounded-lg px-1 text-[0.68rem] font-semibold transition',
                item.primary
                  ? 'text-[var(--primary)]'
                  : active
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted-soft)] hover:text-[var(--foreground)]',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-7 w-9 items-center justify-center rounded-md',
                  item.primary
                    ? 'bg-[var(--primary)] text-white'
                    : active
                      ? 'bg-blue-50 text-[var(--primary)]'
                      : '',
                ].join(' ')}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
