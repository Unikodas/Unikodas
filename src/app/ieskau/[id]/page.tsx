import Link from 'next/link';
import { notFound } from 'next/navigation';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { ReportButton } from '@/components/ReportButton';

type WantedRow = {
  id: string;
  buyer_id: string;
  plate_pattern: string;
  max_price_eur: number | null;
  description: string | null;
  status: string;
  created_at: string;
};

function formatBudget(price: number | null): string {
  if (price === null) return lt.wanted.budgetOpen;
  return `${price.toLocaleString('lt-LT')} €`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('lt-LT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function WantedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS lets anon read active rows; the owner can also see their own
  // closed/removed ones. We never expose buyer_id to the UI.
  const { data: wanted, error } = await supabase
    .from('wanted_listings')
    .select('id, buyer_id, plate_pattern, max_price_eur, description, status, created_at')
    .eq('id', id)
    .maybeSingle<WantedRow>();

  if (error) {
    console.error('[ieskau/detail] query failed:', error);
  }
  if (!wanted) {
    notFound();
  }

  const { data: userData } = await supabase.auth.getUser();
  const isOwner = userData.user?.id === wanted.buyer_id;

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold">
            {lt.appName}
          </Link>
          <Link href="/ieskau" className="text-sm text-slate-600 hover:text-slate-900">
            {lt.common.back}
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="font-mono text-3xl sm:text-4xl font-bold tracking-wider mb-4 break-words">
            {wanted.plate_pattern}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                {lt.wanted.maxPrice}
              </dt>
              <dd className="mt-0.5 font-medium text-base text-slate-900">
                {formatBudget(wanted.max_price_eur)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-slate-500">
                {lt.wanted.postedAt}
              </dt>
              <dd className="mt-0.5">{formatDate(wanted.created_at)}</dd>
            </div>
          </dl>

          {wanted.description && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                {lt.wanted.description}
              </h2>
              <p className="whitespace-pre-wrap text-slate-800">{wanted.description}</p>
            </div>
          )}
        </div>

        {/* Contact disabled until messaging is added (Step 5). */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          {lt.wanted.contactDisabled}
        </div>

        {isOwner && (
          <div className="flex gap-3">
            <Link
              href={`/ieskau/${wanted.id}/redaguoti`}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {lt.wanted.edit}
            </Link>
          </div>
        )}

        {!isOwner && userData.user && (
          <div className="pt-2">
            <ReportButton targetType="wanted" targetId={wanted.id} />
          </div>
        )}
      </main>
    </>
  );
}
