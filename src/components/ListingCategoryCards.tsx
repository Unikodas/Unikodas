import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import type { FlagType, ListingFilters, PlateType } from '@/lib/validation/listing';

type Category = {
  key: keyof typeof lt.home.categories;
  href: string;
  type?: PlateType;
  flag?: FlagType;
};

const CATEGORIES: Category[] = [
  {
    key: 'personalized',
    href: '/?type=personalized',
    type: 'personalized',
  },
  {
    key: 'euSymbol',
    href: '/?flag=eu_symbol',
    flag: 'eu_symbol',
  },
  {
    key: 'vytis',
    href: '/?flag=vytis',
    flag: 'vytis',
  },
  {
    key: 'lithuanianFlag',
    href: '/?flag=lithuanian_flag',
    flag: 'lithuanian_flag',
  },
  {
    key: 'motorcycle',
    href: '/?type=motorcycle',
    type: 'motorcycle',
  },
  {
    key: 'standard',
    href: '/?type=standard',
    type: 'standard',
  },
];

function isActive(category: Category, current: ListingFilters): boolean {
  if (category.type) return current.plate_type === category.type;
  if (category.flag) return current.flag_type === category.flag;
  return false;
}

export function ListingCategoryCards({ current }: { current: ListingFilters }) {
  return (
    <section className="border-b border-[var(--border)] pb-7" aria-labelledby="category-filters-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="category-filters-title" className="text-sm font-bold text-[var(--foreground)]">
          Naršyti pagal tipą
        </h2>
        <Link href="/" className="inline-flex min-h-10 items-center text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {lt.home.allCategories}
        </Link>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((category) => {
          const active = isActive(category, current);

          return (
            <Link
              key={category.key}
              href={category.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'group inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2 text-sm font-semibold transition',
                'hover:border-[var(--border-strong)] hover:text-[var(--foreground)]',
                active
                  ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)]',
              ].join(' ')}
            >
              {lt.home.categories[category.key]}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
