'use client';

import { useActionState } from 'react';
import { lt } from '@/lib/i18n/lt';
import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN } from '@/lib/validation/profile';
import {
  updateDisplayNameAction,
  type DisplayNameFormState,
} from './actions';

interface DisplayNameFormProps {
  initialDisplayName: string | null;
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.profile.errors as Record<string, string>;
  return errs[code] ?? lt.profile.errors.server_error;
}

const initialDisplayNameFormState = {
  error: null,
  success: false,
};

export function DisplayNameForm({ initialDisplayName }: DisplayNameFormProps) {
  const [state, formAction, pending] = useActionState<DisplayNameFormState, FormData>(
    updateDisplayNameAction,
    initialDisplayNameFormState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-[var(--foreground)]">
          {lt.profile.displayNameLabel}
        </span>
        <input
          type="text"
          name="display_name"
          defaultValue={initialDisplayName ?? ''}
          minLength={DISPLAY_NAME_MIN}
          maxLength={DISPLAY_NAME_MAX}
          required
          autoComplete="off"
          placeholder={lt.profile.displayNamePlaceholder}
          className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-3 text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <span className="mt-1 block text-xs leading-5 text-[var(--muted-foreground)]">
          {lt.profile.displayNameHint}
        </span>
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage(state.error)}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700" role="status">
          {lt.profile.saved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="app-button-primary px-4 py-3 text-sm disabled:opacity-60"
      >
        {pending ? lt.common.loading : lt.common.save}
      </button>
    </form>
  );
}
