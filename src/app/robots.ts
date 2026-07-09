import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api/',
        '/profilis',
        '/zinutes',
        '/prisijungti',
        '/nustatyti-slaptazodi',
        '/parduoti',
        '/ieskau/naujas',
        '/ieskau/*/redaguoti',
        '/skelbimas/*/redaguoti',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL.origin,
  };
}
