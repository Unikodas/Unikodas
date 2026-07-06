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
    'w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
  const labelClassName = 'block min-w-[11.5rem] shrink-0 text-sm sm:min-w-0';
  const labelTextClassName = 'mb-1 block text-xs font-semibold uppercase text-[var(--muted-soft)]';
  const optionClassName = 'bg-[var(--input)] text-[var(--foreground)]';

  return (
    <form
      method="GET"
      action="/"
      className="space-y-3 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-lg shadow-black/5 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 lg:grid-cols-7"
    >
      <label className="block text-sm lg:col-span-2">
        <span className={labelTextClassName}>{lt.listings.filters.plateText}</span>
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ''}
          maxLength={20}
          placeholder="ABC123"
          className={fieldClassName}
        />
      </label>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:contents">
        <label className={labelClassName}>
          <span className={labelTextClassName}>{lt.listings.filters.plateType}</span>
          <select
            name="type"
            defaultValue={current.plate_type ?? ''}
            className={fieldClassName}
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
            className={fieldClassName}
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
            className={fieldClassName}
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
            className={fieldClassName}
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
            className={fieldClassName}
          />
        </label>
      </div>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-7">
        <button
          type="submit"
          className="flex-1 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] sm:flex-none"
        >
          {lt.listings.filters.apply}
        </button>
        <Link
          href="/"
          className="rounded-2xl border border-[var(--border-strong)] px-4 py-3 text-center text-sm font-bold text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          {lt.listings.filters.reset}
        </Link>
      </div>
    </form>
  );
}
