import type { MetadataRoute } from 'next';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { absoluteUrl, SITEMAP_CATEGORY_PATHS } from '@/lib/seo';

export const revalidate = 3600;

type SitemapListing = {
  id: string;
  updated_at: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/kaip-parduoti-numeri'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/vardiniai-numeriai'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/motociklu-numeriai'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/numerio-analize'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/idomiausi-numeriai'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    ...SITEMAP_CATEGORY_PATHS.map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];

  const listingRoutes = await getListingRoutes();
  return [...staticRoutes, ...listingRoutes];
}

async function getListingRoutes(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from('listings')
    .select('id, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(5000)
    .returns<SitemapListing[]>();

  if (error) {
    console.error('[sitemap] listing query failed:', error);
    return [];
  }

  return (data ?? []).map((listing) => ({
    url: absoluteUrl(`/skelbimas/${listing.id}`),
    lastModified: listing.updated_at ? new Date(listing.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}
