'use client';

import { useActionState } from 'react';
import { lt } from '@/lib/i18n/lt';
import { PLATE_TYPES, FLAG_TYPES, type ListingInput } from '@/lib/validation/listing';
import { LITHUANIAN_CITIES } from '@/lib/locations/lithuania-cities';

export type ListingFormState = { error: string | null };
export const initialListingFormState: ListingFormState = { error: null };

type ListingFormAction = (
  state: ListingFormState,
  formData: FormData,
) => Promise<ListingFormState>;

interface ListingFormProps {
  /** Pre-filled values when editing; left blank when creating. */
  initial?: Partial<ListingInput>;
  /** Bound Server Action. Both create + edit pages pass a function with this shape. */
  action: ListingFormAction;
  submitLabel: string;
}

/**
 * Map the i18n error codes returned by Server Actions to user-facing
 * Lithuanian copy. Unknown codes fall through to a generic message so
 * we never display a raw key.
 */
function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.listings.errors as Record<string, string>;
  return errs[code] ?? lt.listings.errors.server_error;
}

export function ListingForm({ initial, action, submitLabel }: ListingFormProps) {
  const [state, formAction, pending] = useActionState<ListingFormState, FormData>(
    action,
    initialListingFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.listings.form.plateText}</span>
        <input
          type="text"
          name="plate_text"
          defaultValue={initial?.plate_text ?? ''}
          maxLength={20}
          required
          autoComplete="off"
          placeholder={lt.listings.form.plateTextHint}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="block mt-1 text-xs text-slate-500">{lt.listings.form.plateTextHint}</span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.listings.form.plateType}</span>
        <select
          name="plate_type"
          defaultValue={initial?.plate_type ?? 'standard'}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {PLATE_TYPES.map((t) => (
            <option key={t} value={t}>
              {lt.listings.types[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.listings.flagType}</span>
        <select
          name="flag_type"
          defaultValue={initial?.flag_type ?? 'eu_symbol'}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {FLAG_TYPES.map((f) => (
            <option key={f} value={f}>
              {lt.listings.flagTypes[f]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.listings.form.city}</span>
        <select
          name="city"
          defaultValue={initial?.city ?? ''}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="" disabled>
            —
          </option>
          {LITHUANIAN_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.listings.form.price}</span>
        <input
          type="number"
          name="price_eur"
          defaultValue={initial?.price_eur ?? ''}
          min={0}
          max={999999}
          step={1}
          required
          inputMode="numeric"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="block mt-1 text-xs text-slate-500">{lt.listings.form.priceHint}</span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.listings.form.description}</span>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ''}
          maxLength={2000}
          rows={5}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="block mt-1 text-xs text-slate-500">{lt.listings.form.descriptionHint}</span>
        <span className="block mt-1 text-xs text-amber-700">
          {lt.listings.form.descriptionPrivacyHint}
        </span>
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage(state.error)}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full sm:w-auto rounded-lg bg-slate-900 text-white px-4 py-2 font-medium hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? lt.common.loading : submitLabel}
      </button>
    </form>
  );
}
