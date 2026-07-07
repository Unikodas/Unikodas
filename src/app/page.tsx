import Link from 'next/link';
import type { Metadata } from 'next';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { parseListingFilters } from '@/lib/validation/listing';
import { createPageMetadata, getBrowseSeo } from '@/lib/seo';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { ListingFilters } from '@/components/ListingFilters';
import { ListingCategoryCards } from '@/components/ListingCategoryCards';
import { HomeInfoSections } from '@/components/HomeInfoSections';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CommunityCTA } from '@/components/CommunityCTA';

const BROWSE_PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

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

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = !!userData.user;

  let query = supabase
    .from('listings')
    .select(
      'id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(BROWSE_PAGE_SIZE);

  const stripWildcards = (s: string) => s.replace(/[%_]/g, '');

  if (filters.q) {
    const sanitized = stripWildcards(filters.q);
    if (sanitized.length > 0) {
      query = query.ilike('plate_text', `%${sanitized}%`);
    }
  }
  if (filters.plate_type) query = query.eq('plate_type', filters.plate_type);
  if (filters.flag_type) query = query.eq('flag_type', filters.flag_type);
  if (filters.city) query = query.eq('city', filters.city);
  if (filters.minPrice !== null) query = query.gte('price_eur', filters.minPrice);
  if (filters.maxPrice !== null) query = query.lte('price_eur', filters.maxPrice);

  const { data, error } = await query;
  if (error) {
    console.error('[browse] listings query failed:', error);
  }
  const listings = (data ?? []) as ListingCardData[];
  const hasSparseListings = listings.length > 0 && listings.length <= 3;
  const listingsGridClass = hasSparseListings
    ? 'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(18rem,22rem))] sm:justify-center'
    : 'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <>
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
            <ThemeToggle />
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

        <ListingCategoryCards current={filters} />

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
