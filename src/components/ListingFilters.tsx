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
  return (
    <form
      method="GET"
      action="/"
      className="grid grid-cols-1 gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-2 lg:grid-cols-7"
    >
      <label className="lg:col-span-2 text-sm">
        <span className="mb-1 block text-[var(--muted)]">{lt.listings.filters.plateText}</span>
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ''}
          maxLength={20}
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-[var(--muted)]">{lt.listings.filters.plateType}</span>
        <select
          name="type"
          defaultValue={current.plate_type ?? ''}
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
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
        <span className="mb-1 block text-[var(--muted)]">{lt.listings.flagType}</span>
        <select
          name="flag"
          defaultValue={current.flag_type ?? ''}
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        >
          <option value="">{lt.listings.filters.all}</option>
          {FLAG_TYPES.map((f) => (
            <option key={f} value={f}>
              {lt.listings.flagTypes[f]}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-[var(--muted)]">{lt.listings.filters.city}</span>
        <select
          name="city"
          defaultValue={current.city ?? ''}
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
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
        <span className="mb-1 block text-[var(--muted)]">{lt.listings.filters.minPrice}</span>
        <input
          type="number"
          name="min"
          min={0}
          max={999999}
          step={1}
          defaultValue={current.minPrice ?? ''}
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-[var(--muted)]">{lt.listings.filters.maxPrice}</span>
        <input
          type="number"
          name="max"
          min={0}
          max={999999}
          step={1}
          defaultValue={current.maxPrice ?? ''}
          className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--focus)]"
        />
      </label>

      <div className="sm:col-span-2 lg:col-span-7 flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)]"
        >
          {lt.listings.filters.apply}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
        >
          {lt.listings.filters.reset}
        </Link>
      </div>
    </form>
  );
}
