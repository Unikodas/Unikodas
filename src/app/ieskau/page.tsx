import Link from 'next/link';
import type { Metadata } from 'next';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { parseWantedFilters } from '@/lib/validation/wanted';
import { WantedCard, type WantedCardData } from '@/components/WantedCard';
import { WantedFilters } from '@/components/WantedFilters';
import { LogoLink } from '@/components/LogoLink';
import { MarketplaceTabs } from '@/components/MarketplaceTabs';
import { JsonLd } from '@/components/JsonLd';
import { createPageMetadata } from '@/lib/seo';
import { collectionPageJsonLd, searchResultsPageJsonLd } from '@/lib/structured-data';

const BROWSE_PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const filters = parseWantedFilters(params);
  const path = getWantedCanonicalPath(params);
  const hasQuery = Boolean(filters.q);

  return createPageMetadata({
    title: hasQuery ? `Ieškoma ${filters.q} | Unikodas` : 'Ieškomi numeriai | Unikodas',
    description: hasQuery
      ? `Peržiūrėkite pirkėjų paieškas pagal „${filters.q}“ ir susisiekite per Unikodas vidines žinutes.`
      : 'Peržiūrėkite, kokių automobilių numerių ieško pirkėjai Lietuvoje, arba paskelbkite savo ieškomą derinį Unikodas platformoje.',
    path,
  });
}

export default async function WantedBrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseWantedFilters(params);

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = !!userData.user;

  let query = supabase
    .from('wanted_listings')
    .select('id, plate_pattern, max_price_eur, description, created_at')
    .eq('status', 'active')
    .limit(BROWSE_PAGE_SIZE);

  // Sort: 'newest' (default) or 'cheapest'. For 'cheapest' we order by
  // max_price_eur ascending with nulls last so wanted ads with no
  // budget set don't pollute the cheap end of the list, then by
  // created_at desc as a deterministic tiebreaker.
  if (filters.sort === 'cheapest') {
    query = query
      .order('max_price_eur', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  // Same wildcard-stripping policy as the listings page: user input is
  // a literal substring, not a Postgres ILIKE pattern.
  if (filters.q) {
    const sanitized = filters.q.replace(/[%_]/g, '');
    if (sanitized.length > 0) {
      // Match against plate_pattern OR description so buyers can find
      // ads using either the structured pattern or free-text wording.
      query = query.or(
        `plate_pattern.ilike.%${sanitized}%,description.ilike.%${sanitized}%`,
      );
    }
  }

  const { data, error } = await query;
  if (error) {
    console.error('[ieskau/browse] query failed:', error);
  }
  const items = (data ?? []) as WantedCardData[];
  const path = getWantedCanonicalPath(params);
  const schemaDescription =
    'Pirkėjų ieškomi automobilių numeriai Unikodas platformoje.';

  return (
    <>
      <JsonLd
        data={
          filters.q
            ? searchResultsPageJsonLd({
                name: `Ieškoma ${filters.q}`,
                description: schemaDescription,
                path,
              })
            : collectionPageJsonLd({
                name: 'Ieškomi numeriai',
                description: schemaDescription,
                path,
              })
        }
      />

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <LogoLink />
          <div className="flex items-center gap-3 text-sm sm:gap-4">
            <Link href="/" className="hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:inline">
              {lt.nav.browse}
            </Link>
            {isSignedIn && (
              <Link href="/zinutes" className="hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:inline">
                {lt.nav.messages}
              </Link>
            )}
            <Link
              href="/ieskau/naujas"
              className="app-button-primary min-h-11 px-3 py-2 text-center text-xs sm:px-4 sm:text-sm"
            >
              {lt.wanted.sellCta}
            </Link>
            {isSignedIn ? (
              <Link href="/profilis" className="hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:inline">
                {lt.nav.profile}
              </Link>
            ) : (
              <Link href="/prisijungti" className="hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)] sm:inline">
                {lt.nav.login}
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="app-shell mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-9">
        <MarketplaceTabs active="wanted" />
        <div>
          <h1 className="mb-1 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-5xl">{lt.wanted.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{lt.tagline}</p>
        </div>

        <WantedFilters current={filters} />

        {items.length === 0 ? (
          <p className="py-12 text-center text-[var(--muted-foreground)]">{lt.wanted.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((w) => (
              <WantedCard key={w.id} wanted={w} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function getWantedCanonicalPath(searchParams: SearchParams): string {
  const filters = parseWantedFilters(searchParams);
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);

  const query = params.toString();
  return query ? `/ieskau?${query}` : '/ieskau';
}
