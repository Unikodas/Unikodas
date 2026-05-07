import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { requireAdmin } from '@/lib/auth/require-admin';
import type { ReportReason, ReportTargetType } from '@/lib/validation/report';
import { LogoLink } from '@/components/LogoLink';
import { ReportRowActions } from './ReportRowActions';

const PAGE_SIZE = 50;

type ReportRow = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
};

type ListingTargetSummary = {
  id: string;
  plate_text: string;
  status: string;
};
type WantedTargetSummary = {
  id: string;
  plate_pattern: string;
  status: string;
};
type MessageTargetSummary = {
  id: string;
  body: string;
  listing_id: string | null;
  sender_id: string;
  recipient_id: string;
};
type ReporterSummary = { id: string; display_name: string | null };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('lt-LT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Admin reports queue.
 *
 * Shows pending reports, the reported content inline (so admin doesn't
 * need to navigate away), and three resolution actions per row. Admins
 * use the SERVICE-ROLE client throughout — they need to read message
 * bodies which are otherwise locked behind RLS.
 *
 * Volume is expected to be low (handful of pending reports at a time)
 * so we do simple per-target-type batched lookups instead of building
 * a fancier join.
 */
export default async function AdminPage() {
  const { admin } = await requireAdmin();

  const { data: reportsData, error: reportsError } = await admin
    .from('reports')
    .select('id, reporter_id, target_type, target_id, reason, details, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (reportsError) {
    console.error('[admin] reports fetch failed:', reportsError);
  }
  const reports = (reportsData ?? []) as ReportRow[];

  // Bucket target ids by type for batched lookup.
  const listingIds = new Set<string>();
  const wantedIds = new Set<string>();
  const messageIds = new Set<string>();
  const reporterIds = new Set<string>();
  for (const r of reports) {
    reporterIds.add(r.reporter_id);
    if (r.target_type === 'listing') listingIds.add(r.target_id);
    else if (r.target_type === 'wanted') wantedIds.add(r.target_id);
    else if (r.target_type === 'message') messageIds.add(r.target_id);
  }

  const [listingsRes, wantedRes, messagesRes, reportersRes] = await Promise.all([
    listingIds.size
      ? admin
          .from('listings')
          .select('id, plate_text, status')
          .in('id', Array.from(listingIds))
      : Promise.resolve({ data: [] as ListingTargetSummary[], error: null }),
    wantedIds.size
      ? admin
          .from('wanted_listings')
          .select('id, plate_pattern, status')
          .in('id', Array.from(wantedIds))
      : Promise.resolve({ data: [] as WantedTargetSummary[], error: null }),
    messageIds.size
      ? admin
          .from('messages')
          .select('id, body, listing_id, sender_id, recipient_id')
          .in('id', Array.from(messageIds))
      : Promise.resolve({ data: [] as MessageTargetSummary[], error: null }),
    reporterIds.size
      ? admin
          .from('profiles')
          .select('id, display_name')
          .in('id', Array.from(reporterIds))
      : Promise.resolve({ data: [] as ReporterSummary[], error: null }),
  ]);

  const listingMap = new Map<string, ListingTargetSummary>();
  for (const l of (listingsRes.data ?? []) as ListingTargetSummary[]) {
    listingMap.set(l.id, l);
  }
  const wantedMap = new Map<string, WantedTargetSummary>();
  for (const w of (wantedRes.data ?? []) as WantedTargetSummary[]) {
    wantedMap.set(w.id, w);
  }
  const messageMap = new Map<string, MessageTargetSummary>();
  for (const m of (messagesRes.data ?? []) as MessageTargetSummary[]) {
    messageMap.set(m.id, m);
  }
  const reporterMap = new Map<string, string>();
  for (const p of (reportersRes.data ?? []) as ReporterSummary[]) {
    reporterMap.set(p.id, p.display_name ?? '');
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoLink />
            <span className="text-sm font-medium text-slate-600">{lt.admin.title}</span>
          </div>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <h1 className="text-2xl font-semibold">{lt.admin.reportsTitle}</h1>

        {reports.length === 0 ? (
          <p className="text-center text-slate-500 py-12">{lt.admin.empty}</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => {
              const reporterName = reporterMap.get(r.reporter_id) || lt.messages.unknownUser;
              const targetTypeLabel = lt.admin.targetTypes[r.target_type];
              const reasonLabel = lt.admin.reasons[r.reason];

              let targetView: React.ReactNode = (
                <span className="text-xs text-slate-400 italic">
                  {lt.admin.targetMissing}
                </span>
              );
              let targetLink: { href: string; label: string } | null = null;

              if (r.target_type === 'listing') {
                const t = listingMap.get(r.target_id);
                if (t) {
                  targetView = (
                    <span className="font-mono text-sm">
                      {t.plate_text}
                      <span className="ml-2 text-xs text-slate-500">({t.status})</span>
                    </span>
                  );
                  targetLink = {
                    href: `/skelbimas/${t.id}`,
                    label: lt.admin.actions.viewTarget,
                  };
                }
              } else if (r.target_type === 'wanted') {
                const t = wantedMap.get(r.target_id);
                if (t) {
                  targetView = (
                    <span className="font-mono text-sm">
                      {t.plate_pattern}
                      <span className="ml-2 text-xs text-slate-500">({t.status})</span>
                    </span>
                  );
                  targetLink = {
                    href: `/ieskau/${t.id}`,
                    label: lt.admin.actions.viewTarget,
                  };
                }
              } else if (r.target_type === 'message') {
                const t = messageMap.get(r.target_id);
                if (t) {
                  targetView = (
                    <p className="text-sm whitespace-pre-wrap text-slate-800">{t.body}</p>
                  );
                }
              }

              return (
                <li
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3 text-xs text-slate-500">
                    <span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {targetTypeLabel}
                      </span>{' '}
                      ·{' '}
                      <span className="font-medium text-slate-700">{reasonLabel}</span>
                    </span>
                    <span>{formatDate(r.created_at)}</span>
                  </div>

                  <div>{targetView}</div>

                  {r.details && (
                    <p className="text-sm text-slate-600 italic">“{r.details}”</p>
                  )}

                  <div className="text-xs text-slate-500">
                    {lt.admin.reporterLabel}: {reporterName}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                    {targetLink && (
                      <Link
                        href={targetLink.href}
                        className="text-xs text-slate-600 hover:text-slate-900 underline"
                      >
                        {targetLink.label}
                      </Link>
                    )}
                    <ReportRowActions reportId={r.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
