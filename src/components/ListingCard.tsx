import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import type { PlateType, FlagType } from '@/lib/validation/listing';
import type { InterestingPlateInsight } from '@/lib/interesting-plates';
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
  partner_tier?: 'nightrider' | null;
  created_at: string;
};

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  return `${price.toLocaleString('lt-LT')} €`;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}...`;
}

export function ListingCard({
  listing,
  insight = null,
  isSignedIn = false,
}: {
  listing: ListingCardData;
  insight?: InterestingPlateInsight | null;
  isSignedIn?: boolean;
}) {
  const typeLabel = lt.listings.types[listing.plate_type] ?? listing.plate_type;
  const flagLabel = lt.listings.flagTypes[listing.flag_type] ?? listing.flag_type;
  const loginHref = `/prisijungti?redirect=${encodeURIComponent(`/skelbimas/${listing.id}`)}`;

  return (
    <article className="group app-card relative flex h-full min-h-[19rem] flex-col overflow-hidden [contain-intrinsic-size:19rem] [content-visibility:auto] transition-colors hover:border-[var(--border-strong)] sm:min-h-[21rem] sm:[contain-intrinsic-size:21rem]">
      <div className="absolute right-3 top-3 z-10">
        {isSignedIn ? (
          <button
            type="button"
            disabled
            aria-label="Išsaugoti"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-lg text-slate-600 sm:text-xl"
            title="Išsaugojimo funkcija ruošiama"
          >
            ♡
          </button>
        ) : (
          <Link
            href={loginHref}
            aria-label="Prisijunkite, kad išsaugotumėte"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-lg text-slate-600 transition hover:border-[var(--primary)] hover:text-[var(--primary)] sm:text-xl"
          >
            ♡
          </Link>
        )}
      </div>

      <Link href={`/skelbimas/${listing.id}`} className="flex flex-1 flex-col">
        <div className="flex min-h-36 items-center justify-center border-b border-[var(--border)] bg-[var(--muted)] px-4 py-6 sm:min-h-44 sm:py-7">
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
              <div className="text-2xl font-bold tracking-tight text-[var(--foreground)] sm:text-[1.7rem]">
                {formatPrice(listing.price_eur)}
              </div>
              <div className="mt-1 text-sm font-medium text-[var(--muted-foreground)]">{listing.city}</div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {listing.partner_tier === 'nightrider' && (
                <span className="inline-flex items-center gap-1 rounded-md border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[0.65rem] font-bold tracking-wide text-fuchsia-800">
                  <span aria-hidden="true">✦</span> NIGHTRIDERS
                </span>
              )}
              {insight?.label && (
                <span
                  className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-[var(--primary)]"
                  title={`Unikodas įžvalgos: ${insight.score}/100`}
                >
                  {insight.label}
                </span>
              )}
              {listing.is_verified_listing && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  {lt.listings.verifiedBadge}
                </span>
              )}
            </div>
          </div>

          <p className="listing-card__description mt-3 text-sm leading-6 text-[var(--muted-foreground)] sm:min-h-10 sm:text-base">
            {listing.description ? truncate(listing.description, 88) : `${typeLabel} · ${flagLabel}`}
          </p>

          <p className="mt-auto border-t border-[var(--border)] pt-3 text-xs font-medium text-[var(--muted-soft)] sm:text-sm">
            {typeLabel} <span aria-hidden="true">·</span> {flagLabel}
          </p>
        </div>
      </Link>
    </article>
  );
}
