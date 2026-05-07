import Link from 'next/link';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { parseWantedFilters } from '@/lib/validation/wanted';
import { WantedCard, type WantedCardData } from '@/components/WantedCard';
import { WantedFilters } from '@/components/WantedFilters';
import { LogoLink } from '@/components/LogoLink';

const BROWSE_PAGE_SIZE = 50;

type SearchParams = Record<string, string | string[] | undefined>;

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

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <LogoLink />
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-slate-700 hover:text-slate-900 hidden sm:inline">
              {lt.nav.browse}
            </Link>
            {isSignedIn && (
              <Link href="/zinutes" className="text-slate-700 hover:text-slate-900 hidden sm:inline">
                {lt.nav.messages}
              </Link>
            )}
            <Link
              href="/ieskau/naujas"
              className="rounded-lg bg-slate-900 text-white px-3 py-1.5 font-medium hover:bg-slate-800"
            >
              {lt.wanted.sellCta}
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
          <h1 className="text-2xl font-semibold mb-1">{lt.wanted.title}</h1>
          <p className="text-sm text-slate-600">{lt.tagline}</p>
        </div>

        <WantedFilters current={filters} />

        {items.length === 0 ? (
          <p className="text-center text-slate-500 py-12">{lt.wanted.empty}</p>
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
