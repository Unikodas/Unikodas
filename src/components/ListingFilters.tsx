import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { PLATE_TYPES, type ListingFilters as Filters } from '@/lib/validation/listing';
import { LITHUANIAN_CITIES } from '@/lib/locations/lithuania-cities';

/**
 * URL-driven filter form. Renders as a plain HTML <form method="GET">
 * pointing at "/", so submitting it navigates to /?q=…&type=…&city=…
 * with no client-side JS. The browse page reads the params and applies
 * them to its Supabase query.
 */
export function ListingFilters({ current }: { current: Filters }) {
  return (
    <form
      method="GET"
      action="/"
      className="rounded-2xl border border-slate-200 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
    >
      <label className="lg:col-span-2 text-sm">
        <span className="block text-slate-600 mb-1">{lt.listings.filters.plateText}</span>
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ''}
          maxLength={20}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </label>

      <label className="text-sm">
        <span className="block text-slate-600 mb-1">{lt.listings.filters.plateType}</span>
        <select
          name="type"
          defaultValue={current.plate_type ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">{lt.listings.filters.all}</option>
          {PLATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {lt.listings.types[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="block text-slate-600 mb-1">{lt.listings.filters.city}</span>
        <select
          name="city"
          defaultValue={current.city ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="">{lt.listings.filters.all}</option>
          {LITHUANIAN_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="block text-slate-600 mb-1">{lt.listings.filters.minPrice}</span>
        <input
          type="number"
          name="min"
          min={0}
          max={999999}
          step={1}
          defaultValue={current.minPrice ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </label>

      <label className="text-sm">
        <span className="block text-slate-600 mb-1">{lt.listings.filters.maxPrice}</span>
        <input
          type="number"
          name="max"
          min={0}
          max={999999}
          step={1}
          defaultValue={current.maxPrice ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </label>

      <div className="sm:col-span-2 lg:col-span-6 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
        >
          {lt.listings.filters.apply}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {lt.listings.filters.reset}
        </Link>
      </div>
    </form>
  );
}
