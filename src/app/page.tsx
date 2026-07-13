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
import { PlatePreview } from '@/components/PlatePreview';
import { CommunityCTA } from '@/components/CommunityCTA';
import { PartnerProductCard } from '@/components/PartnerProductCard';
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

  const [isSignedIn, listings, interestingListings] = await Promise.all([
    getIsSignedIn(),
    getCachedActiveListings(filters, BROWSE_PAGE_SIZE),
    getCachedHomeInterestingListings(HOME_INTERESTING_LISTINGS_LIMIT),
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

      <main className="app-shell mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-9">
        <section className="app-card grid max-w-full gap-6 overflow-hidden p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div className="min-w-0">
            <p className="max-w-full text-sm font-black uppercase text-[var(--primary)] [overflow-wrap:anywhere]">
              {lt.tagline}
            </p>
            <h1 className="mt-3 max-w-full text-[clamp(2rem,9vw,3rem)] font-black leading-tight tracking-tight text-[var(--foreground)] [overflow-wrap:anywhere] sm:text-5xl">
              {lt.home.heroTitle}
            </h1>
            <p className="mt-3 max-w-full text-base leading-7 text-[var(--muted-foreground)] [overflow-wrap:anywhere] sm:max-w-2xl">
              {lt.home.heroLead}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/parduoti" className="app-button-primary flex min-h-[52px] w-full items-center justify-center px-5 py-3 text-center text-sm sm:w-auto">
                Įdėti skelbimą
              </Link>
              <Link href="#paieska" className="app-button-secondary flex min-h-[52px] w-full items-center justify-center px-5 py-3 text-center text-sm sm:w-auto">
                Ieškoti numerio
              </Link>
            </div>
            <CommunityCTA placement="hero" className="mt-5" variant="embedded" />
            <aside className="mt-4 rounded-3xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--primary)_8%,var(--muted))] p-4">
              <p className="text-sm font-black text-[var(--foreground)]">
                {lt.home.complianceTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                {lt.home.complianceLead}
              </p>
            </aside>
            <Link
              href="/numerio-analize"
              className="mt-4 block rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4 transition hover:border-[var(--primary)]"
            >
              <span className="block text-lg font-black text-[var(--foreground)]">
                Patikrinkite savo numerį
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">
                Sužinokite, ar numeris turi paslėptą reikšmę, vardą ar automobilių asociaciją.
              </span>
              <span className="mt-3 inline-flex text-sm font-black text-[var(--primary)]">
                Analizuoti numerį
              </span>
            </Link>
            <Link
              href="/idomiausi-numeriai"
              className="mt-3 block rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4 transition hover:border-[var(--primary)]"
            >
              <span className="block text-lg font-black text-[var(--foreground)]">
                Atraskite įdomiausius numerius
              </span>
              <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">
                Peržiūrėkite skelbimus, kuriuos Unikodas įžvalgos įvertino kaip stipriausius.
              </span>
              <span className="mt-3 inline-flex text-sm font-black text-[var(--primary)]">
                Žiūrėti reitingą
              </span>
            </Link>
          </div>
          <div className="flex min-w-0 justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] p-4 sm:justify-end sm:p-5">
            <PlatePreview
              plateText="UN1K0D"
              plateType="personalized"
              flagType="eu_symbol"
              size="lg"
              className="plate-preview--hero"
            />
          </div>
        </section>

        <PartnerProductCard className="max-w-3xl" />

        <ListingCategoryCards current={filters} />

        {interestingListings.length > 0 && (
          <section className="space-y-4" aria-labelledby="interesting-listings-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="interesting-listings-title" className="text-2xl font-black text-[var(--foreground)]">
                  Įdomiausi numeriai
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Automatiškai atrinkti deriniai pagal raštus, paslėptas reikšmes ir automobilių asociacijas.
                </p>
              </div>
              <Link href="/idomiausi-numeriai" className="app-button-secondary min-h-11 px-4 py-2 text-sm">
                Visi įdomiausi
              </Link>
            </div>

            <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {interestingListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  insight={listing.insight}
                  isSignedIn={isSignedIn}
                />
              ))}
            </div>
          </section>
        )}

        <section id="paieska" className="scroll-mt-24">
          <ListingFilters current={filters} />
        </section>

        <section className="space-y-4" aria-labelledby="listings-title">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 id="listings-title" className="text-2xl font-black text-[var(--foreground)]">
                {lt.home.listingsTitle}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{lt.home.listingsLead}</p>
            </div>
            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
              {listings.length}
            </span>
          </div>

          {listings.length === 0 ? (
            <div className="app-card space-y-5 border-dashed px-4 py-8 text-center sm:px-6">
              <p className="text-sm text-[var(--muted-foreground)]">{lt.listings.empty}</p>
              <CommunityCTA placement="empty_search" className="text-left" variant="embedded" />
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

        <HomeInfoSections />
      </main>
    </>
  );
}
