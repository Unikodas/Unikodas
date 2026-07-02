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
        <h2 className="text-sm font-medium">{lt.profile.emailSettingsTitle}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {lt.profile.emailSettingsHint}
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">{lt.profile.emailLabel}</span>
        <input
          type="email"
          name="email"
          defaultValue={initialEmail ?? ''}
          maxLength={PROFILE_EMAIL_MAX}
          autoComplete="email"
          placeholder={lt.profile.emailPlaceholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="email_notifications_enabled"
          defaultChecked={initialEmailNotificationsEnabled}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
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
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? lt.common.loading : lt.common.save}
      </button>
    </form>
  );
}
