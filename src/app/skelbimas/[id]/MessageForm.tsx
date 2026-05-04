'use client';

import { useActionState } from 'react';
import { lt } from '@/lib/i18n/lt';

export type MessageFormState = { error: string | null };
export const initialMessageFormState: MessageFormState = { error: null };

type MessageFormAction = (
  state: MessageFormState,
  formData: FormData,
) => Promise<MessageFormState>;

interface MessageFormProps {
  action: MessageFormAction;
  submitLabel: string;
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.messages.errors as Record<string, string>;
  return errs[code] ?? lt.messages.errors.server_error;
}

export function MessageForm({ action, submitLabel }: MessageFormProps) {
  const [state, formAction, pending] = useActionState<MessageFormState, FormData>(
    action,
    initialMessageFormState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <textarea
        name="body"
        maxLength={2000}
        rows={4}
        required
        placeholder={lt.messages.form.bodyPlaceholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
      />
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
