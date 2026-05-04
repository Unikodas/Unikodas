import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import type { PlateType, FlagType } from '@/lib/validation/listing';

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

export function ListingCard({ listing }: { listing: ListingCardData }) {
  const typeLabel = lt.listings.types[listing.plate_type] ?? listing.plate_type;
  const flagLabel = lt.listings.flagTypes[listing.flag_type] ?? listing.flag_type;

  return (
    <Link
      href={`/skelbimas/${listing.id}`}
      className="block rounded-2xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm transition p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="font-mono text-2xl font-bold tracking-wider">
          {listing.plate_text}
        </div>
        {listing.is_verified_listing && (
          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {lt.listings.verifiedBadge}
          </span>
        )}
      </div>

      <dl className="text-sm text-slate-600 space-y-1">
        <div className="flex gap-2">
          <dt className="text-slate-400 w-16">{lt.listings.plateType}</dt>
          <dd>{typeLabel}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-400 w-16">{lt.listings.flagType}</dt>
          <dd>{flagLabel}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-400 w-16">{lt.listings.city}</dt>
          <dd>{listing.city}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-slate-400 w-16">{lt.listings.price}</dt>
          <dd className="font-medium text-slate-900">{formatPrice(listing.price_eur)}</dd>
        </div>
      </dl>
    </Link>
  );
}
