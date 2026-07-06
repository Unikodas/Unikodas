'use client';

import { useEffect, useMemo, useState, useActionState } from 'react';
import { lt } from '@/lib/i18n/lt';
import { replyToMessageAction } from './actions';

export type ReplyFormState = { error: string | null; success: boolean };
const initialReplyFormState: ReplyFormState = { error: null, success: false };

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.messages.errors as Record<string, string>;
  return errs[code] ?? lt.messages.errors.server_error;
}

/**
 * Inline reply control for a received message in /zinutes.
 *
 * Closed by default — shows a small "Atsakyti" trigger. Click to
 * expand a textarea + send/cancel buttons. After a successful submit
 * we briefly show "Atsakymas išsiųstas." then auto-collapse.
 *
 * No threading or real-time — this is the minimal "the seller can
 * reply" loop the inbox was missing.
 */
export function ReplyButton({ messageId }: { messageId: string }) {
  const [open, setOpen] = useState(false);

  // Bind the message id into the action once per id. useMemo keeps the
  // bound reference stable across re-renders so useActionState doesn't
  // re-initialise its state on every parent re-render.
  const boundAction = useMemo(
    () => replyToMessageAction.bind(null, messageId),
    [messageId],
  );

  const [state, formAction, pending] = useActionState<ReplyFormState, FormData>(
    boundAction,
    initialReplyFormState,
  );

  // Auto-collapse a moment after a successful submit so the inbox
  // returns to its compact state.
  useEffect(() => {
    if (state.success && open) {
      const t = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(t);
    }
  }, [state.success, open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[var(--primary)] hover:underline"
      >
        {lt.messages.reply}
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 w-full space-y-2">
      <textarea
        name="body"
        maxLength={2000}
        rows={3}
        required
        placeholder={lt.messages.form.bodyPlaceholder}
        className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      />
      {state.error && (
        <p className="text-xs text-red-600" role="alert">
          {errorMessage(state.error)}
        </p>
      )}
      {state.success && (
        <p className="text-xs text-emerald-700" role="status">
          {lt.messages.replied}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {pending ? lt.common.loading : lt.messages.form.send}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-xl border border-[var(--border-strong)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-60"
        >
          {lt.common.cancel}
        </button>
      </div>
    </form>
  );
}
