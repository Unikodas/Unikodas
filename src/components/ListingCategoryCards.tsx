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
  {
    key: 'standard',
    href: '/?type=standard',
    plateText: 'ABC123',
    plateType: 'standard',
    flagType: 'eu_symbol',
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
    <section className="space-y-4" aria-labelledby="category-filters-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="category-filters-title" className="text-lg font-semibold text-[var(--text)]">
            {lt.home.categoriesTitle}
          </h2>
        </div>
        <Link href="/" className="inline-flex min-h-10 items-center text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          {lt.home.allCategories}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-6">
        {CATEGORIES.map((category) => {
          const active = isActive(category, current);

          return (
            <Link
              key={category.key}
              href={category.href}
              aria-current={active ? 'page' : undefined}
              className={[
                'group app-card-soft flex min-h-44 flex-col justify-between overflow-hidden p-3.5 transition sm:min-h-44',
                'hover:-translate-y-0.5 hover:border-[var(--border-strong)]',
                active
                  ? 'border-[var(--primary)] ring-2 ring-[color:color-mix(in_srgb,var(--primary)_35%,transparent)]'
                  : 'border-[var(--border)]',
              ].join(' ')}
            >
              <div className="flex min-h-28 items-center justify-center rounded-3xl bg-[color:color-mix(in_srgb,var(--background)_72%,var(--primary)_8%)] px-1.5">
                <PlatePreview
                  plateText={category.plateText}
                  plateType={category.plateType}
                  flagType={category.flagType}
                  icon={category.icon}
                  size="sm"
                  className="plate-preview--category mx-auto"
                />
              </div>
              <span className="mt-3 text-sm font-extrabold text-[var(--foreground)]">
                {lt.home.categories[category.key]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
