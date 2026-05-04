'use client';

import { useActionState } from 'react';
import { lt } from '@/lib/i18n/lt';
import type { WantedInput } from '@/lib/validation/wanted';

export type WantedFormState = { error: string | null };
export const initialWantedFormState: WantedFormState = { error: null };

type WantedFormAction = (
  state: WantedFormState,
  formData: FormData,
) => Promise<WantedFormState>;

interface WantedFormProps {
  initial?: Partial<WantedInput>;
  action: WantedFormAction;
  submitLabel: string;
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.wanted.errors as Record<string, string>;
  return errs[code] ?? lt.wanted.errors.server_error;
}

export function WantedForm({ initial, action, submitLabel }: WantedFormProps) {
  const [state, formAction, pending] = useActionState<WantedFormState, FormData>(
    action,
    initialWantedFormState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.wanted.form.pattern}</span>
        <input
          type="text"
          name="plate_pattern"
          defaultValue={initial?.plate_pattern ?? ''}
          maxLength={50}
          autoComplete="off"
          placeholder={lt.wanted.form.patternHint}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="block mt-1 text-xs text-slate-500">
          {lt.wanted.form.patternHint} —{' '}
          {lt.wanted.errors.pattern_or_description_required}
        </span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.wanted.form.maxPrice}</span>
        <input
          type="number"
          name="max_price_eur"
          defaultValue={initial?.max_price_eur ?? ''}
          min={0}
          max={999999}
          step={1}
          inputMode="numeric"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="block mt-1 text-xs text-slate-500">{lt.wanted.form.maxPriceHint}</span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium mb-1">{lt.wanted.form.description}</span>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ''}
          maxLength={2000}
          rows={5}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <span className="block mt-1 text-xs text-slate-500">{lt.wanted.form.descriptionHint}</span>
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
