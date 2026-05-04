import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';

export type WantedCardData = {
  id: string;
  plate_pattern: string;
  max_price_eur: number | null;
  description: string | null;
  created_at: string;
};

function formatBudget(price: number | null): string {
  if (price === null) return lt.wanted.budgetOpen;
  return `${price.toLocaleString('lt-LT')} €`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

export function WantedCard({ wanted }: { wanted: WantedCardData }) {
  return (
    <Link
      href={`/ieskau/${wanted.id}`}
      className="block rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition p-4"
    >
      <div className="font-mono text-xl font-semibold tracking-wider mb-2 break-words">
        {wanted.plate_pattern}
      </div>

      {wanted.description && (
        <p className="text-sm text-slate-600 mb-3">
          {truncate(wanted.description, 140)}
        </p>
      )}

      <dl className="text-sm text-slate-600">
        <div className="flex gap-2">
          <dt className="text-slate-400 w-24">{lt.wanted.maxPrice}</dt>
          <dd className="font-medium text-slate-900">{formatBudget(wanted.max_price_eur)}</dd>
        </div>
      </dl>
    </Link>
  );
}
