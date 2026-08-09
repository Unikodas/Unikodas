import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { parseListingFilters } from '@/lib/validation/listing';
import { createPageMetadata, getBrowseSeo } from '@/lib/seo';
import { ListingCard } from '@/components/ListingCard';
import { ListingFilters } from '@/components/ListingFilters';
import { ListingCategoryCards } from '@/components/ListingCategoryCards';
import { HomeInfoSections } from '@/components/HomeInfoSections';
import { LogoLink } from '@/components/LogoLink';
import { PartnerProductCard } from '@/components/PartnerProductCard';
import { MarketplaceTabs } from '@/components/MarketplaceTabs';
import { JsonLd } from '@/components/JsonLd';
import {
  collectionPageJsonLd,
  itemListJsonLd,
  organizationJsonLd,
  searchResultsPageJsonLd,
  websiteJsonLd,
} from '@/lib/structured-data';
import { hasSupabaseAuthCookie } from '@/lib/auth/cookies';
import {
  getCachedActiveListings,
  getCachedHomeInterestingListings,
} from '@/lib/public-listings';

const BROWSE_PAGE_SIZE = 120;
const HOME_INTERESTING_LISTINGS_LIMIT = 8;

type SearchParams = Record<string, string | string[] | undefined>;

async function getIsSignedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  if (!hasSupabaseAuthCookie(cookieStore.getAll())) return false;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return !!data.user;
}

async function getActiveAuctionCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('public_auctions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['scheduled', 'live'])
    .gt('ends_at', new Date().toISOString());
  if (error) {
    console.error('[home] auction count failed:', error);
    return 0;
  }
  return count ?? 0;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  return createPageMetadata(getBrowseSeo(params));
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListingFilters(params);
  const seo = getBrowseSeo(params);

  const [isSignedIn, listings, interestingListings, activeAuctionCount] = await Promise.all([
    getIsSignedIn(),
    getCachedActiveListings(filters, BROWSE_PAGE_SIZE),
    getCachedHomeInterestingListings(HOME_INTERESTING_LISTINGS_LIMIT),
    getActiveAuctionCount(),
  ]);

  const hasSparseListings = listings.length > 0 && listings.length <= 3;
  const listingsGridClass = hasSparseListings
    ? 'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(18rem,22rem))] sm:justify-center'
    : 'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(),
          filters.q ||
          filters.plate_type ||
          filters.flag_type ||
          filters.city ||
          filters.minPrice !== null ||
          filters.maxPrice !== null
            ? searchResultsPageJsonLd({
                name: seo.title,
                description: seo.description,
                path: seo.path,
              })
            : collectionPageJsonLd({
                name: 'Unikodas numerių prekyvietė',
                description: seo.description,
                path: seo.path,
              }),
          itemListJsonLd({
            name: 'Naujausi numeriai',
            path: seo.path,
            listings,
          }),
        ]}
      />

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <LogoLink />
          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <Link href="/ieskau" className="hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:inline">
              {lt.nav.wanted}
            </Link>
            {isSignedIn && (
              <Link href="/zinutes" className="hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:inline">
                {lt.nav.messages}
              </Link>
            )}
            <Link
              href="/parduoti"
              className="hidden rounded-xl bg-[var(--primary)] px-3 py-1.5 font-bold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] sm:inline-flex"
            >
              {lt.listings.sellCta}
            </Link>
            <Link
              href={isSignedIn ? '/zinutes' : '/prisijungti?redirect=%2Fzinutes'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_76%,transparent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:hidden"
              aria-label={lt.nav.messages}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 5h16v11H8l-4 4V5z" />
                <path d="M8 9h8" />
                <path d="M8 12h5" />
              </svg>
            </Link>
            <Link
              href={isSignedIn ? '/profilis' : '/prisijungti'}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_76%,transparent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:h-auto sm:w-auto sm:border-0 sm:bg-transparent"
              aria-label={isSignedIn ? lt.nav.profile : lt.nav.login}
            >
              <span className="hidden sm:inline">{isSignedIn ? lt.nav.profile : lt.nav.login}</span>
              <svg className="h-5 w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M5 21a7 7 0 0 1 14 0" />
              </svg>
            </Link>
          </div>
        </nav>
      </header>

      <main className="app-shell mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <MarketplaceTabs active="listings" auctionCount={activeAuctionCount} />
        <section className="border-b border-[var(--border)] pb-7 pt-8 sm:pb-9 sm:pt-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted-soft)]">
                {lt.tagline}
              </p>
              <h1 className="mt-3 text-[clamp(2.25rem,7vw,4.5rem)] font-black leading-[0.98] tracking-[-0.045em] text-[var(--foreground)]">
                Parduodami automobilių numeriai
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)] sm:text-lg">
                Raskite norimą derinį arba įkelkite savo skelbimą. Susisiekimas su pardavėju – tiesiogiai per Unikodas.
              </p>
            </div>
            <Link href="/parduoti" className="app-button-primary inline-flex min-h-12 w-full shrink-0 items-center justify-center px-5 py-3 text-sm sm:w-auto">
              Įdėti skelbimą
            </Link>
          </div>
        </section>

        <section id="paieska" className="scroll-mb-36 scroll-mt-24 py-6 sm:py-8">
          <ListingFilters current={filters} />
        </section>

        <ListingCategoryCards current={filters} />

        <section className="mt-8 space-y-4 sm:mt-10" aria-labelledby="listings-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="listings-title" className="text-2xl font-black text-[var(--foreground)]">
                {lt.home.listingsTitle}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">Aktyvūs pardavėjų skelbimai, naujausi rodomi pirmiausia.</p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
              {listings.length}
            </span>
          </div>

          {listings.length === 0 ? (
            <div className="app-card space-y-5 border-dashed px-4 py-8 text-center sm:px-6">
              <p className="text-sm text-[var(--muted-foreground)]">{lt.listings.empty}</p>
              <Link href="/parduoti" className="app-button-primary inline-flex min-h-11 items-center px-5 py-2 text-sm">
                Įdėti pirmą skelbimą
              </Link>
            </div>
          ) : (
            <div
              className={
                hasSparseListings
                  ? 'rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-3 sm:p-4'
                  : undefined
              }
            >
              <div className={listingsGridClass}>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} isSignedIn={isSignedIn} />
                ))}
              </div>
            </div>
          )}
        </section>

        {interestingListings.length > 0 && (
          <section className="mt-14 border-t border-[var(--border)] pt-9" aria-labelledby="interesting-listings-title">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted-soft)]">Atrinkta</p>
                <h2 id="interesting-listings-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">Įdomesni deriniai</h2>
              </div>
              <Link href="/idomiausi-numeriai" className="text-sm font-bold text-[var(--primary)] hover:underline">Peržiūrėti visus</Link>
            </div>
            <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {interestingListings.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} insight={listing.insight} isSignedIn={isSignedIn} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-14 grid border-y border-[var(--border)] py-2 sm:grid-cols-3" aria-label="Papildomos Unikodas funkcijos">
          <Link href="/numerio-analize" className="group border-b border-[var(--border)] py-5 sm:border-b-0 sm:border-r sm:px-5 sm:first:pl-0">
            <span className="block font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">Numerio analizė</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">Patikrinkite derinio reikšmę ir asociacijas.</span>
          </Link>
          <Link href="/ieskau" className="group border-b border-[var(--border)] py-5 sm:border-b-0 sm:border-r sm:px-5">
            <span className="block font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">Ieškomi numeriai</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">Paskelbkite, kokio derinio ieškote.</span>
          </Link>
          <a href="https://t.me/+xweru-k3heRlMjY0" target="_blank" rel="noopener noreferrer" className="group py-5 sm:pl-5">
            <span className="block font-bold text-[var(--foreground)] group-hover:text-[var(--primary)]">Telegram bendruomenė</span>
            <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">Nauji skelbimai ir numerių entuziastų diskusijos.</span>
          </a>
        </section>

        <section className="mt-8 grid gap-6 border-b border-[var(--border)] pb-10 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
          <div className="text-sm leading-6 text-[var(--muted-foreground)]">
            <p className="font-bold text-[var(--foreground)]">{lt.home.complianceTitle}</p>
            <p>{lt.home.complianceLead}</p>
          </div>
          <PartnerProductCard />
        </section>

        <HomeInfoSections />
      </main>
    </>
  );
}
