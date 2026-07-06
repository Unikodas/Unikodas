import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import {
  FLAG_TYPES,
  PLATE_TYPES,
  type ListingFilters as Filters,
} from '@/lib/validation/listing';
import { LITHUANIAN_CITIES } from '@/lib/locations/lithuania-cities';

/**
 * URL-driven filter form. Renders as a plain HTML <form method="GET">
 * pointing at "/", so submitting it navigates to /?q=…&type=…&city=…
 * with no client-side JS. The browse page reads the params and applies
 * them to its Supabase query.
 */
export function ListingFilters({ current }: { current: Filters }) {
  const fieldClassName =
    'w-full app-search-field px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
  const chipFieldClassName =
    'h-11 w-full rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--input)_86%,transparent)] px-4 text-sm font-bold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
  const labelClassName = 'block min-w-[10.75rem] shrink-0 text-sm sm:min-w-0';
  const labelTextClassName = 'mb-1 block text-xs font-bold uppercase text-[var(--muted-soft)]';
  const optionClassName = 'bg-[var(--input)] text-[var(--foreground)]';

  return (
    <form
      method="GET"
      action="/"
      className="app-card space-y-4 p-4 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-7"
    >
      <label className="block text-sm lg:col-span-2">
        <span className="sr-only">{lt.listings.filters.plateText}</span>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--primary)]"
            aria-hidden="true"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
          </span>
          <input
            type="text"
            name="q"
            defaultValue={current.q ?? ''}
            maxLength={20}
            placeholder="Ieškoti numerio"
            className={`${fieldClassName} pl-12 pr-12`}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]"
            aria-label={lt.listings.filters.apply}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </label>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:contents">
        <label className={labelClassName}>
          <span className={labelTextClassName}>{lt.listings.filters.plateType}</span>
          <select
            name="type"
            defaultValue={current.plate_type ?? ''}
            className={chipFieldClassName}
          >
            <option value="" className={optionClassName}>
              {lt.listings.filters.all}
            </option>
            {PLATE_TYPES.map((t) => (
              <option key={t} value={t} className={optionClassName}>
                {lt.listings.types[t]}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>{lt.listings.flagType}</span>
          <select
            name="flag"
            defaultValue={current.flag_type ?? ''}
            className={chipFieldClassName}
          >
            <option value="" className={optionClassName}>
              {lt.listings.filters.all}
            </option>
            {FLAG_TYPES.map((f) => (
              <option key={f} value={f} className={optionClassName}>
                {lt.listings.flagTypes[f]}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>{lt.listings.filters.city}</span>
          <select
            name="city"
            defaultValue={current.city ?? ''}
            className={chipFieldClassName}
          >
            <option value="" className={optionClassName}>
              {lt.listings.filters.all}
            </option>
            {LITHUANIAN_CITIES.map((c) => (
              <option key={c} value={c} className={optionClassName}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>{lt.listings.filters.minPrice}</span>
          <input
            type="number"
            name="min"
            min={0}
            max={999999}
            step={1}
            defaultValue={current.minPrice ?? ''}
            className={chipFieldClassName}
          />
        </label>

        <label className={labelClassName}>
          <span className={labelTextClassName}>{lt.listings.filters.maxPrice}</span>
          <input
            type="number"
            name="max"
            min={0}
            max={999999}
            step={1}
            defaultValue={current.maxPrice ?? ''}
            className={chipFieldClassName}
          />
        </label>
      </div>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-7">
        <button
          type="submit"
          className="app-button-primary flex-1 px-4 py-3 text-sm hover:bg-[var(--primary-hover)] sm:flex-none"
        >
          {lt.listings.filters.apply}
        </button>
        <Link
          href="/"
          className="app-button-secondary px-4 py-3 text-center text-sm hover:bg-[var(--muted)]"
        >
          {lt.listings.filters.reset}
        </Link>
      </div>
    </form>
  );
}
