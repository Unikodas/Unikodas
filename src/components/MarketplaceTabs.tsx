import Link from 'next/link';

type Tab = 'listings' | 'auctions' | 'wanted';

const tabs = [
  { id: 'listings' as const, href: '/', label: 'Parduodami' },
  { id: 'auctions' as const, href: '/aukcionai', label: 'Aukcionai' },
  { id: 'wanted' as const, href: '/ieskau', label: 'Ieškomi' },
];

export function MarketplaceTabs({ active, auctionCount = 0 }: { active: Tab; auctionCount?: number }) {
  return (
    <nav aria-label="Skelbimų tipai" className="grid grid-cols-3 border-b border-[var(--border)]">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          aria-current={active === tab.id ? 'page' : undefined}
          className={[
            '-mb-px flex min-h-12 min-w-0 items-center justify-center border-b-2 px-1 text-center text-xs font-semibold transition sm:px-2 sm:text-sm',
            active === tab.id
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          ].join(' ')}
        >
          <span>{tab.label}</span>
          {tab.id === 'auctions' && auctionCount > 0 && (
            <span
              className="ml-1 inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white sm:ml-1.5 sm:min-h-5 sm:min-w-5 sm:text-[11px]"
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
