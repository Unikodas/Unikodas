'use client';

import { useActionState } from 'react';
import { lt } from '@/lib/i18n/lt';
import { PROFILE_EMAIL_MAX } from '@/lib/validation/profile';
import {
  updateEmailSettingsAction,
  type EmailSettingsFormState,
} from './actions';

type EmailSettingsFormProps = {
  initialEmail: string | null;
  initialEmailNotificationsEnabled: boolean;
};

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.profile.errors as Record<string, string>;
  return errs[code] ?? lt.profile.errors.server_error;
}

const initialEmailSettingsFormState = {
  error: null,
  success: false,
};

export function EmailSettingsForm({
  initialEmail,
  initialEmailNotificationsEnabled,
}: EmailSettingsFormProps) {
  const [state, formAction, pending] = useActionState<EmailSettingsFormState, FormData>(
    updateEmailSettingsAction,
    initialEmailSettingsFormState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-[var(--foreground)]">{lt.profile.emailSettingsTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
          {lt.profile.emailSettingsHint}
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-bold text-[var(--foreground)]">{lt.profile.emailLabel}</span>
        <input
          type="email"
          name="email"
          defaultValue={initialEmail ?? ''}
          maxLength={PROFILE_EMAIL_MAX}
          autoComplete="email"
          placeholder={lt.profile.emailPlaceholder}
          className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-3 text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl bg-[var(--muted)] p-3 text-sm font-semibold text-[var(--foreground)]">
        <input
          type="checkbox"
          name="email_notifications_enabled"
          defaultChecked={initialEmailNotificationsEnabled}
          className="mt-1 h-4 w-4 rounded border-[var(--border-strong)] bg-[var(--input)] text-[var(--primary)] focus:ring-[var(--ring)]"
        />
        <span>{lt.profile.emailNotificationsToggle}</span>
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
