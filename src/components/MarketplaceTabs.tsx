import Link from 'next/link';

type Tab = 'listings' | 'auctions' | 'wanted';

const tabs = [
  { id: 'listings' as const, href: '/', label: 'Parduodami' },
  { id: 'auctions' as const, href: '/aukcionai', label: 'Aukcionai' },
  { id: 'wanted' as const, href: '/ieskau', label: 'Ieškomi' },
];

export function MarketplaceTabs({ active, auctionCount = 0 }: { active: Tab; auctionCount?: number }) {
  return (
    <nav aria-label="Skelbimų tipai" className="grid grid-cols-3 rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? 'page' : undefined}
          className={[
            'flex min-h-11 items-center justify-center rounded-xl px-2 text-center text-sm font-black transition',
            active === tab.id
              ? 'bg-[var(--card)] text-[var(--primary)] shadow-sm'
              : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          ].join(' ')}
        >
          <span>{tab.label}</span>
          {tab.id === 'auctions' && auctionCount > 0 && (
            <span
              className="ml-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-black leading-none text-white shadow-sm"
              aria-label={`${auctionCount} aktyvus aukcionas`}
            >
              {auctionCount > 99 ? '99+' : auctionCount}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
