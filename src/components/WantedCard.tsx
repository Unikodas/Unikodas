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
      className="app-card block min-w-0 overflow-hidden p-5 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
    >
      <div className="mb-3 break-words font-mono text-xl font-black tracking-wider text-[var(--foreground)]">
        {wanted.plate_pattern}
      </div>

      {wanted.description && (
        <p className="mb-4 text-sm leading-6 text-[var(--muted-foreground)]">
          {truncate(wanted.description, 140)}
        </p>
      )}

      <dl className="text-sm text-[var(--muted-foreground)]">
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 text-[var(--muted-soft)]">{lt.wanted.maxPrice}</dt>
          <dd className="min-w-0 font-bold text-[var(--foreground)]">{formatBudget(wanted.max_price_eur)}</dd>
        </div>
      </dl>
    </Link>
  );
}
