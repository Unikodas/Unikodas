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
  // Next 15: searchParams is a Promise in Server Components
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseListingFilters(params);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = !!userData.user;

  // Build the query incrementally. RLS already restricts public callers
  // to active listings; we re-state status='active' here so logged-in
  // sellers don't see their own non-active rows on the public browse.
  let query = supabase
    .from('listings')
    .select(
      'id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(BROWSE_PAGE_SIZE);

  // Strip user-supplied wildcard characters so input acts as a literal
  // substring rather than broadening the match. Postgres ILIKE doesn't
  // honor `\` as an escape by default, so stripping is simpler than
  // wiring the ESCAPE clause through supabase-js.
  const stripWildcards = (s: string) => s.replace(/[%_]/g, '');

  if (filters.q) {
    const sanitized = stripWildcards(filters.q);
    if (sanitized.length > 0) {
      query = query.ilike('plate_text', `%${sanitized}%`);
    }
  }
  if (filters.plate_type) query = query.eq('plate_type', filters.plate_type);
  if (filters.flag_type) query = query.eq('flag_type', filters.flag_type);
  // City is now an enum value from the canonical list, so exact match.
  if (filters.city) {
    query = query.eq('city', filters.city);
  }
  if (filters.minPrice !== null) query = query.gte('price_eur', filters.minPrice);
  if (filters.maxPrice !== null) query = query.lte('price_eur', filters.maxPrice);

  const { data, error } = await query;
  if (error) {
    console.error('[browse] listings query failed:', error);
  }
  const listings = (data ?? []) as ListingCardData[];
  const hasSparseListings = listings.length > 0 && listings.length <= 3;
  const listingsGridClass =
    hasSparseListings
      ? 'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(18rem,22rem))] sm:justify-center'
      : 'grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <LogoLink />
          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <Link href="/ieskau" className="hidden text-[var(--muted)] hover:text-[var(--text)] sm:inline">
              {lt.nav.wanted}
            </Link>
            {isSignedIn && (
              <Link href="/zinutes" className="hidden text-[var(--muted)] hover:text-[var(--text)] sm:inline">
                {lt.nav.messages}
              </Link>
            )}
            <Link
              href="/parduoti"
              className="rounded-lg bg-[var(--primary)] px-3 py-1.5 font-medium text-[var(--primary-contrast)] hover:bg-[var(--primary-hover)]"
            >
              {lt.listings.sellCta}
            </Link>
            {isSignedIn ? (
              <Link href="/profilis" className="text-[var(--muted)] hover:text-[var(--text)]">
                {lt.nav.profile}
              </Link>
            ) : (
              <Link href="/prisijungti" className="text-[var(--muted)] hover:text-[var(--text)]">
                {lt.nav.login}
              </Link>
            )}
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-7 sm:px-6 sm:py-9">
        <section className="grid gap-6 border-b border-[var(--border)] pb-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">{lt.tagline}</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
              {lt.home.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              {lt.home.heroLead}
            </p>
          </div>
          <div className="hidden justify-end sm:flex">
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
        <ListingFilters current={filters} />

        <section className="space-y-4" aria-labelledby="listings-title">
          <div>
            <h2 id="listings-title" className="text-2xl font-semibold text-[var(--text)]">
              {lt.home.listingsTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">{lt.home.listingsLead}</p>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-4 py-12 text-center">
              <p className="text-sm text-[var(--muted)]">{lt.listings.empty}</p>
            </div>
          ) : (
            <div
              className={
                hasSparseListings
                  ? 'rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 sm:p-4'
                  : undefined
              }
            >
              <div className={listingsGridClass}>
                {listings.map((l) => (
                  <ListingCard key={l.id} listing={l} />
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
