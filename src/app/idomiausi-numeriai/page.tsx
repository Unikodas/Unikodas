import Link from 'next/link';
import type { Metadata } from 'next';

import { JsonLd } from '@/components/JsonLd';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import {
  INTERESTING_LISTING_CANDIDATE_LIMIT,
  rankInterestingListings,
  type WithInterestingPlateInsight,
} from '@/lib/interesting-plates';
import { createPageMetadata } from '@/lib/seo';
import { breadcrumbJsonLd, collectionPageJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { createClient } from '@/lib/supabase/server';
import type { FlagType, PlateType } from '@/lib/validation/listing';

type InterestingListingRow = {
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

export const metadata: Metadata = createPageMetadata({
  title: 'Įdomiausi numeriai | Unikodas',
  description:
    'Atraskite įdomiausius automobilių numerius pagal Unikodas įžvalgas: paslėptas reikšmes, vardus, automobilių modelius ir išskirtinius raštus.',
  path: '/idomiausi-numeriai',
});

export default async function InterestingPlatesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(INTERESTING_LISTING_CANDIDATE_LIMIT);

  if (error) {
    console.error('[interesting-plates] listings query failed:', error);
  }

  // TODO: cache or precompute Unikodas įžvalgų scores when active listing volume grows.
  const listings = rankInterestingListings((data ?? []) as InterestingListingRow[], 24);

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            name: 'Įdomiausi numeriai',
            description:
              'Automatiškai atrinkti automobilių numeriai pagal Unikodas įžvalgas, raštus ir atpažįstamas reikšmes.',
            path: '/idomiausi-numeriai',
          }),
          itemListJsonLd({
            name: 'Įdomiausi numeriai',
            path: '/idomiausi-numeriai',
            listings,
          }),
          breadcrumbJsonLd([
            { name: 'Numeriai', path: '/' },
            { name: 'Įdomiausi numeriai', path: '/idomiausi-numeriai' },
          ]),
        ]}
      />

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/" className="inline-flex min-h-11 min-w-12 items-center justify-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Atgal
          </Link>
        </nav>
      </header>

      <main className="app-shell mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-9">
        <section className="app-card p-5 sm:p-8">
          <p className="text-sm font-black uppercase text-[var(--primary)]">Unikodas įžvalgos</p>
          <h1 className="mt-3 text-[clamp(2.2rem,9vw,4rem)] font-black leading-tight tracking-tight text-[var(--foreground)]">
            Įdomiausi numeriai
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
            Šis sąrašas automatiškai reitinguoja naujausius aktyvius skelbimus pagal Unikodas
            įžvalgas: paslėptas reikšmes, vardus, automobilių modelių nuorodas, pasikartojančius
            skaičius, simetriškus raštus ir bendrą įsimenamumą.
          </p>
          <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-xs leading-5 text-[var(--muted-foreground)]">
            Reitingas nėra oficialus vertinimas ar garantuota rinkos kaina.
          </p>
        </section>

        {listings.length > 0 ? (
          <section className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <InterestingPlateCard key={listing.id} listing={listing} />
            ))}
          </section>
        ) : (
          <section className="app-card border-dashed p-6 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">
              Kol kas nėra pakankamai stiprių derinių. Užsukite vėliau arba įkelkite savo numerį.
            </p>
            <Link href="/parduoti" className="app-button-primary mt-4 min-h-11 px-4 py-2 text-sm">
              Įkelti skelbimą
            </Link>
          </section>
        )}
      </main>
    </>
  );
}

function InterestingPlateCard({
  listing,
}: {
  listing: WithInterestingPlateInsight<InterestingListingRow>;
}) {
  return (
    <article className="app-card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]">
      <Link href={`/skelbimas/${listing.id}`} className="flex flex-1 flex-col">
        <div className="flex min-h-44 items-center justify-center bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] px-4 py-7">
          <PlatePreview
            plateText={listing.plate_text}
            plateType={listing.plate_type}
            flagType={listing.flag_type}
            size="lg"
          />
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-3xl font-black text-[var(--primary)]">
                {formatPrice(listing.price_eur)}
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--muted-foreground)]">{listing.city}</p>
            </div>
            <div className="rounded-3xl border border-[var(--primary)]/30 bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] px-3 py-2 text-right">
              <p className="text-xl font-black text-[var(--primary)]">{listing.insight.score}</p>
              <p className="text-[0.65rem] font-black uppercase text-[var(--muted-soft)]">balai</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {listing.insight.label && (
              <span className="rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-black text-[var(--primary-foreground)]">
                {listing.insight.label}
              </span>
            )}
            {listing.insight.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-bold text-[var(--foreground)]"
              >
                {badge}
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
            {listing.insight.reason}
          </p>
        </div>
      </Link>
    </article>
  );
}

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  return `${price.toLocaleString('lt-LT')} €`;
}
