'use client';

import { useActionState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import {
  sendConversationMessageAction,
  type ConversationMessageFormState,
} from './actions';

const initialConversationMessageFormState: ConversationMessageFormState = {
  error: null,
  success: false,
};

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.messages.errors as Record<string, string>;
  return errs[code] ?? lt.messages.errors.server_error;
}

export function ConversationComposer({ threadKey }: { threadKey: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = useMemo(
    () => sendConversationMessageAction.bind(null, threadKey),
    [threadKey],
  );
  const [state, formAction, pending] = useActionState<ConversationMessageFormState, FormData>(
    boundAction,
    initialConversationMessageFormState,
  );

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex items-end gap-2 rounded-3xl border border-[var(--border)] bg-[var(--input)] p-2 shadow-[0_-10px_32px_rgba(0,0,0,0.18)]">
        <textarea
          name="body"
          maxLength={2000}
          rows={2}
          required
          placeholder={lt.messages.form.bodyPlaceholder}
          className="min-h-12 flex-1 resize-none rounded-2xl border-0 bg-transparent px-3 py-2 text-base text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-0 disabled:text-[var(--muted-foreground)]"
          disabled={pending}
        />
        <button
          type="submit"
          disabled={pending}
          className="app-button-primary inline-flex h-12 shrink-0 items-center justify-center px-4 text-sm disabled:opacity-60"
        >
          {pending ? lt.common.loading : lt.messages.form.send}
        </button>
      </div>
      {state.error && (
        <p className="px-2 text-sm text-red-600" role="alert">
          {errorMessage(state.error)}
        </p>
      )}
    </form>
  );
}
