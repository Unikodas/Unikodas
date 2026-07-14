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
    <article className="group app-card relative flex h-full min-h-[21rem] flex-col overflow-hidden [contain-intrinsic-size:21rem] [content-visibility:auto] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] sm:min-h-[24rem] sm:[contain-intrinsic-size:24rem]">
      <div className="absolute right-4 top-4 z-10">
        {isSignedIn ? (
          <button
            type="button"
            disabled
            aria-label="Išsaugoti"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/25 text-lg text-white/80 opacity-90 backdrop-blur sm:h-11 sm:w-11 sm:text-xl"
            title="Išsaugojimo funkcija ruošiama"
          >
            ♡
          </button>
        ) : (
          <Link
            href={loginHref}
            aria-label="Prisijunkite, kad išsaugotumėte"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/25 text-lg text-white backdrop-blur transition hover:border-[var(--primary)] hover:text-[var(--primary)] sm:h-11 sm:w-11 sm:text-xl"
          >
            ♡
          </Link>
        )}
      </div>

      <Link href={`/skelbimas/${listing.id}`} className="flex flex-1 flex-col">
        <div className="flex min-h-36 items-center justify-center bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] px-4 py-6 sm:min-h-48 sm:py-8">
          <PlatePreview
            plateText={listing.plate_text}
            plateType={listing.plate_type}
            flagType={listing.flag_type}
            size="lg"
          />
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-2xl font-black tracking-tight text-[var(--primary)] sm:text-3xl">
                {formatPrice(listing.price_eur)}
              </div>
              <div className="mt-1 text-sm font-bold text-[var(--foreground)] sm:text-base">{listing.city}</div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              {insight?.label && (
                <span
                  className="inline-flex items-center rounded-full border border-[var(--primary)]/30 bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] px-2 py-0.5 text-xs font-black text-[var(--primary)]"
                  title={`Unikodas įžvalgos: ${insight.score}/100`}
                >
                  {insight.label}
                </span>
              )}
              {listing.is_verified_listing && (
                <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                  {lt.listings.verifiedBadge}
                </span>
              )}
            </div>
          </div>

          <p className="listing-card__description mt-3 text-sm leading-6 text-[var(--muted-foreground)] sm:min-h-10 sm:text-base">
            {listing.description ? truncate(listing.description, 88) : `${typeLabel} · ${flagLabel}`}
          </p>

          <dl className="mt-auto grid grid-cols-2 gap-2 pt-4 text-xs sm:gap-3 sm:pt-5 sm:text-sm">
            <div className="rounded-2xl bg-[var(--muted)] p-2.5 sm:p-3">
              <dt className="text-xs font-bold uppercase text-[var(--muted-soft)]">
                {lt.listings.plateType}
              </dt>
              <dd className="mt-1 font-bold text-[var(--foreground)]">{typeLabel}</dd>
            </div>
            <div className="rounded-2xl bg-[var(--muted)] p-2.5 sm:p-3">
              <dt className="text-xs font-bold uppercase text-[var(--muted-soft)]">
                {lt.listings.flagType}
              </dt>
              <dd className="mt-1 font-bold text-[var(--foreground)]">{flagLabel}</dd>
            </div>
          </dl>
        </div>
      </Link>
    </article>
  );
}
