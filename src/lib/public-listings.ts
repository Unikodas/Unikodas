import 'server-only';

import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { ListingCardData } from '@/components/ListingCard';
import {
  INTERESTING_LISTING_CANDIDATE_LIMIT,
  rankInterestingListings,
  type WithInterestingPlateInsight,
} from '@/lib/interesting-plates';
import type { ListingFilters } from '@/lib/validation/listing';

const LISTING_SELECT =
  'id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at';

const PUBLIC_LISTINGS_REVALIDATE_SECONDS = 120;
const INTERESTING_LISTINGS_REVALIDATE_SECONDS = 300;

const EMPTY_FILTERS: ListingFilters = {
  q: null,
  plate_type: null,
  flag_type: null,
  city: null,
  minPrice: null,
  maxPrice: null,
};

function createPublicListingsClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  return createSupabaseClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function stripWildcards(s: string) {
  return s.replace(/[%_]/g, '');
}

async function fetchActiveListings(
  filters: ListingFilters,
  limit: number,
): Promise<ListingCardData[]> {
  const supabase = createPublicListingsClient();
  if (!supabase) return [];

  let query = supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(limit);

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

  const { data, error } = await query.returns<ListingCardData[]>();
  if (error) {
    console.info('[public-listings] active listings lookup skipped:', error.message);
    return [];
  }

  return data ?? [];
}

export const getCachedActiveListings = unstable_cache(
  async (filters: ListingFilters, limit: number) => fetchActiveListings(filters, limit),
  ['public-active-listings-v1'],
  { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS },
);

export const getCachedHomeInterestingListings = unstable_cache(
  async (limit: number): Promise<Array<WithInterestingPlateInsight<ListingCardData>>> => {
    const candidates = await fetchActiveListings(
      EMPTY_FILTERS,
      INTERESTING_LISTING_CANDIDATE_LIMIT,
    );
    return rankInterestingListings(candidates, limit);
  },
  ['home-interesting-listings-v1'],
  { revalidate: INTERESTING_LISTINGS_REVALIDATE_SECONDS },
);
