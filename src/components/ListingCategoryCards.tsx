import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import type { FlagType, ListingFilters, PlateType } from '@/lib/validation/listing';
import { PlatePreview } from '@/components/PlatePreview';

type Category = {
  key: keyof typeof lt.home.categories;
  href: string;
  plateText: string;
  plateType: PlateType;
  flagType: FlagType;
  icon?: 'motorcycle';
  type?: PlateType;
  flag?: FlagType;
};

const CATEGORIES: Category[] = [
  {
    key: 'personalized',
    href: '/?type=personalized',
    plateText: 'MANO1',
    plateType: 'personalized',
    flagType: 'eu_symbol',
    type: 'personalized',
  },
  {
    key: 'euSymbol',
    href: '/?flag=eu_symbol',
    plateText: 'EU2026',
    plateType: 'standard',
    flagType: 'eu_symbol',
    flag: 'eu_symbol',
  },
  {
    key: 'vytis',
    href: '/?flag=vytis',
    plateText: 'VYTIS',
    plateType: 'standard',
    flagType: 'vytis',
    flag: 'vytis',
  },
  {
    key: 'standard',
    href: '/?type=standard',
    plateText: 'ABC123',
    plateType: 'standard',
    flagType: 'eu_symbol',
    type: 'standard',
  },
  {
    key: 'lithuanianFlag',
    href: '/?flag=lithuanian_flag',
    plateText: 'LT2026',
    plateType: 'standard',
    flagType: 'lithuanian_flag',
    flag: 'lithuanian_flag',
  },
  {
    key: 'motorcycle',
    href: '/?type=motorcycle',
    plateText: '123AB',
    plateType: 'motorcycle',
    flagType: 'lithuanian_flag',
    type: 'motorcycle',
  },
];

function isActive(category: Category, current: ListingFilters): boolean {
  if (category.type) return current.plate_type === category.type;
  if (category.flag) return current.flag_type === category.flag;
  return false;
}

export function ListingCategoryCards({ current }: { current: ListingFilters }) {
  return (
    <section className="space-y-4" aria-labelledby="category-filters-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="category-filters-title" className="text-lg font-semibold text-[var(--text)]">
            {lt.home.categoriesTitle}
          </h2>
        </div>
        <Link href="/" className="text-sm font-medium text-[var(--muted)] hover:text-[var(--text)]">
          {lt.home.allCategories}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {CATEGORIES.map((category) => {
          const active = isActive(category, current);

          return (
            <Link
              key={category.key}
              href={category.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'group flex min-h-44 flex-col justify-between rounded-lg border bg-[var(--surface)] p-4 transition',
                'hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-md',
                active
                  ? 'border-[var(--border-strong)] ring-2 ring-[var(--focus)]'
                  : 'border-[var(--border)]',
              ].join(' ')}
            >
              <div className="flex min-h-28 items-center justify-center">
                <PlatePreview
                  plateText={category.plateText}
                  plateType={category.plateType}
                  flagType={category.flagType}
                  icon={category.icon}
                  size="sm"
                  className="plate-preview--category mx-auto"
                />
              </div>
              <span className="mt-4 text-sm font-semibold text-[var(--text)]">
                {lt.home.categories[category.key]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
