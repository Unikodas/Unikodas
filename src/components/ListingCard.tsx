import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import type { PlateType, FlagType } from '@/lib/validation/listing';
import { PlatePreview } from '@/components/PlatePreview';

export type ListingCardData = {
  id: string;
  plate_text: string;
  plate_type: PlateType;
  flag_type: FlagType;
  city: string;
  price_eur: number | null;
  description: string | null;
  is_verified_listing: boolean;
  created_at: string;
};

function formatPrice(price: number | null): string {
  // Price is required at the schema/DB level after migration 0006;
  // null is only possible on pre-migration legacy rows. Show a dash
  // rather than the old "Kaina sutartinė" copy.
  if (price === null) return '—';
  return `${price.toLocaleString('lt-LT')} €`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const typeLabel = lt.listings.types[listing.plate_type] ?? listing.plate_type;
  const flagLabel = lt.listings.flagTypes[listing.flag_type] ?? listing.flag_type;

  return (
    <Link
      href={`/skelbimas/${listing.id}`}
      className="group flex h-full min-h-[22rem] flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-lg"
    >
      <div className="flex min-h-32 items-center justify-center bg-[var(--surface-muted)] p-4">
        <PlatePreview
          plateText={listing.plate_text}
          plateType={listing.plate_type}
          flagType={listing.flag_type}
          size="lg"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-semibold text-[var(--text)]">
              {formatPrice(listing.price_eur)}
            </div>
            <div className="mt-1 text-sm font-medium text-[var(--muted)]">{listing.city}</div>
          </div>

          {listing.is_verified_listing && (
            <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {lt.listings.verifiedBadge}
            </span>
          )}
        </div>

        <p className="mt-3 min-h-10 text-sm leading-5 text-[var(--muted)]">
          {listing.description ? truncate(listing.description, 92) : ''}
        </p>

        <dl className="mt-auto grid grid-cols-2 gap-3 pt-4 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase text-[var(--muted-soft)]">
              {lt.listings.plateType}
            </dt>
            <dd className="mt-1 font-medium text-[var(--text)]">{typeLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-[var(--muted-soft)]">
              {lt.listings.flagType}
            </dt>
            <dd className="mt-1 font-medium text-[var(--text)]">{flagLabel}</dd>
          </div>
        </dl>
      </div>
    </Link>
  );
}
