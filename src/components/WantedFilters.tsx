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
      className="rounded-2xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-4 gap-3"
    >
      <label className="sm:col-span-2 text-sm">
        <span className="block text-slate-600 mb-1">{lt.wanted.filters.q}</span>
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ''}
          maxLength={60}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </label>

      <label className="text-sm">
        <span className="block text-slate-600 mb-1">{lt.wanted.filters.sort}</span>
        <select
          name="sort"
          defaultValue={current.sort}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
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

      <div className="flex gap-2 items-end">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          {lt.wanted.filters.apply}
        </button>
        <Link
          href="/ieskau"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {lt.wanted.filters.reset}
        </Link>
      </div>
    </form>
  );
}
