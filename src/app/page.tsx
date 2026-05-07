import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { parseListingFilters } from '@/lib/validation/listing';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { ListingFilters } from '@/components/ListingFilters';
import { LogoLink } from '@/components/LogoLink';

const BROWSE_PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

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

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <div className="flex items-center gap-4 text-sm">
            <Link href="/ieskau" className="text-slate-700 hover:text-slate-900 hidden sm:inline">
              {lt.nav.wanted}
            </Link>
            {isSignedIn && (
              <Link href="/zinutes" className="text-slate-700 hover:text-slate-900 hidden sm:inline">
                {lt.nav.messages}
              </Link>
            )}
            <Link
              href="/parduoti"
              className="rounded-lg bg-slate-900 text-white px-3 py-1.5 font-medium hover:bg-slate-800"
            >
              {lt.listings.sellCta}
            </Link>
            {isSignedIn ? (
              <Link href="/profilis" className="text-slate-700 hover:text-slate-900">
                {lt.nav.profile}
              </Link>
            ) : (
              <Link href="/prisijungti" className="text-slate-700 hover:text-slate-900">
                {lt.nav.login}
              </Link>
            )}
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">{lt.listings.title}</h1>
          <p className="text-sm text-slate-600">{lt.tagline}</p>
        </div>

        <ListingFilters current={filters} />

        {listings.length === 0 ? (
          <p className="text-center text-slate-500 py-12">{lt.listings.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
