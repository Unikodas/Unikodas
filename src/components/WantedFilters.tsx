import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import {
  WANTED_SORT_OPTIONS,
  type WantedListingsFilters,
} from '@/lib/validation/wanted';

/**
 * URL-driven filter form for wanted listings. Plain HTML
 * <form method="GET"> targeting /ieskau, no client JS.
 */
export function WantedFilters({ current }: { current: WantedListingsFilters }) {
  return (
    <form
      method="GET"
      action="/ieskau"
      className="app-card grid grid-cols-1 gap-4 p-5 sm:grid-cols-4"
    >
      <label className="sm:col-span-2 text-sm">
        <span className="mb-1.5 block font-bold text-[var(--foreground)]">{lt.wanted.filters.q}</span>
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ''}
          maxLength={60}
          className="app-search-field min-h-12 w-full px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1.5 block font-bold text-[var(--foreground)]">{lt.wanted.filters.sort}</span>
        <select
          name="sort"
          defaultValue={current.sort}
          className="app-search-field min-h-12 w-full px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          {WANTED_SORT_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value === 'cheapest'
                ? lt.wanted.filters.sortCheapest
                : lt.wanted.filters.sortNewest}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="app-button-primary min-h-12 flex-1 px-4 py-2 text-sm sm:flex-none"
        >
          {lt.wanted.filters.apply}
        </button>
        <Link
          href="/ieskau"
          className="app-button-secondary min-h-12 flex-1 px-4 py-2 text-sm sm:flex-none"
        >
          {lt.wanted.filters.reset}
        </Link>
      </div>
    </form>
  );
}
