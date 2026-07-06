'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { lt } from '@/lib/i18n/lt';
import { REPORT_REASONS } from '@/lib/validation/report';
import type { ReportTargetType } from '@/lib/validation/report';
import { createReportAction } from '@/lib/actions/reports';

type ReportFormState = {
  error: string | null;
  success: boolean;
};

const initialReportFormState: ReportFormState = {
  error: null,
  success: false,
};

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  /** Compact mode: small text-style trigger (used inside message rows). */
  compact?: boolean;
}

function errorMessage(code: string | null): string | null {
  if (!code) return null;
  const errs = lt.report.errors as Record<string, string>;
  return errs[code] ?? lt.report.errors.server_error;
}

export function ReportButton({ targetType, targetId, compact }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ReportFormState, FormData>(
    createReportAction,
    initialReportFormState,
  );

  // Close the form a moment after a successful submission so the user
  // sees the "sent" confirmation, then it goes away.
  useEffect(() => {
    if (state.success && open) {
      const t = setTimeout(() => setOpen(false), 1500);
      return () => clearTimeout(t);
    }
  }, [state.success, open]);

  const triggerClass = compact
    ? 'text-xs font-semibold text-current opacity-75 underline hover:opacity-100'
    : 'rounded-xl border border-[var(--border-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]';

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
        {lt.report.cta}
      </button>
    );
  }


  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-[var(--foreground)]"
    >
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />

      <h3 className="text-sm font-semibold text-[var(--foreground)]">{lt.report.title}</h3>

      <label className="block">
        <span className="mb-1 block text-xs text-[var(--muted-foreground)]">{lt.report.reasonLabel}</span>
        <select
          name="reason"
          required
          defaultValue=""
          className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="" disabled className="bg-[var(--input)] text-[var(--foreground)]">
            —
          </option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r} className="bg-[var(--input)] text-[var(--foreground)]">
              {lt.report.reasons[r]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs text-[var(--muted-foreground)]">{lt.report.detailsLabel}</span>
        <textarea
          name="details"
          maxLength={1000}
          rows={3}
          placeholder={lt.report.detailsPlaceholder}
          className="w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </label>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage(state.error)}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-emerald-700" role="status">
          {lt.report.sent}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[var(--primary)] px-3 py-1.5 text-sm font-semibold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] disabled:opacity-60"
        >
          {pending ? lt.common.loading : lt.report.submit}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-xl border border-[var(--border-strong)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] disabled:opacity-60"
        >
          {lt.report.cancel}
        </button>
      </div>
    </form>
  );
}
