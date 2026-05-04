'use client';

import { useTransition } from 'react';
import { lt } from '@/lib/i18n/lt';
import {
  dismissReportAction,
  removeAndResolveReportAction,
  resolveReportAction,
} from './actions';

export function ReportRowActions({ reportId }: { reportId: string }) {
  const [pending, startTransition] = useTransition();

  function showError(code: string) {
    const errs = lt.admin.errors as Record<string, string>;
    alert(errs[code] ?? lt.admin.errors.server_error);
  }

  function dismiss() {
    if (!confirm(lt.admin.confirm.dismiss)) return;
    startTransition(async () => {
      const r = await dismissReportAction(reportId);
      if (r.error) showError(r.error);
    });
  }
  function resolve() {
    if (!confirm(lt.admin.confirm.resolve)) return;
    startTransition(async () => {
      const r = await resolveReportAction(reportId);
      if (r.error) showError(r.error);
    });
  }
  function remove() {
    if (!confirm(lt.admin.confirm.remove)) return;
    startTransition(async () => {
      const r = await removeAndResolveReportAction(reportId);
      if (r.error) showError(r.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={dismiss}
        disabled={pending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {lt.admin.actions.dismiss}
      </button>
      <button
        type="button"
        onClick={resolve}
        disabled={pending}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {lt.admin.actions.resolve}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="rounded-lg border border-red-300 text-red-700 px-3 py-1.5 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
      >
        {lt.admin.actions.remove}
      </button>
    </div>
  );
}
