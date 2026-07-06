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
        className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] disabled:bg-[var(--muted)] disabled:text-[var(--muted-foreground)]"
      />
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage(state.error)}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-[var(--primary)] px-4 py-3 font-bold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60 sm:w-auto"
      >
        {pending ? lt.common.loading : submitLabel}
      </button>
    </form>
  );
}
