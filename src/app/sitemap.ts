import type { MetadataRoute } from 'next';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { absoluteUrl, SITEMAP_CATEGORY_PATHS } from '@/lib/seo';
import { getEncyclopediaSitemapPaths } from '@/lib/topic-encyclopedia';

export const revalidate = 3600;

type SitemapListing = {
  id: string;
  plate_text: string | null;
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
      url: absoluteUrl('/apie'),
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
    {
      url: absoluteUrl('/numerio-verte'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/ieskau'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: absoluteUrl('/aukcionai'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/privatumas'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl('/taisykles'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...SITEMAP_CATEGORY_PATHS.map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...getEncyclopediaSitemapPaths().map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
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
    .select('id, plate_text, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(5000)
    .returns<SitemapListing[]>();

  if (error) {
    console.error('[sitemap] listing query failed:', error);
    return [];
  }

  const listingPages = (data ?? []).map((listing) => ({
    url: absoluteUrl(`/skelbimas/${listing.id}`),
    lastModified: listing.updated_at ? new Date(listing.updated_at) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const seenPlates = new Set<string>();
  const platePages = (data ?? []).flatMap((listing) => {
    const plate = normalizePlateForSitemap(listing.plate_text ?? '');
    if (!plate || seenPlates.has(plate)) return [];
    seenPlates.add(plate);
    return [
      {
        url: absoluteUrl(`/numerio/${plate}`),
        lastModified: listing.updated_at ? new Date(listing.updated_at) : undefined,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      },
    ];
  });

  return [...listingPages, ...platePages];
}

function normalizePlateForSitemap(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
}
