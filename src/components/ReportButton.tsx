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
    ? 'text-xs text-slate-500 hover:text-slate-900 underline'
    : 'rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50';

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
      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
    >
      <input type="hidden" name="target_type" value={targetType} />
      <input type="hidden" name="target_id" value={targetId} />

      <h3 className="text-sm font-semibold">{lt.report.title}</h3>

      <label className="block">
        <span className="block text-xs text-slate-600 mb-1">{lt.report.reasonLabel}</span>
        <select
          name="reason"
          required
          defaultValue=""
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          <option value="" disabled>
            —
          </option>
          {REPORT_REASONS.map((r) => (
            <option key={r} value={r}>
              {lt.report.reasons[r]}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="block text-xs text-slate-600 mb-1">{lt.report.detailsLabel}</span>
        <textarea
          name="details"
          maxLength={1000}
          rows={3}
          placeholder={lt.report.detailsPlaceholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
          className="rounded-lg bg-slate-900 text-white px-3 py-1.5 text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {pending ? lt.common.loading : lt.report.submit}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {lt.report.cancel}
        </button>
      </div>
    </form>
  );
}
