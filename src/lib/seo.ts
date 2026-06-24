import type { Metadata } from 'next';
import { parseListingFilters, type FlagType, type PlateType } from '@/lib/validation/listing';

export const SITE_NAME = 'Unikodas';
export const DEFAULT_SITE_URL = 'https://unikodas.lt';
export const HOME_TITLE = 'Unikodas – Lietuvos automobilių numerių prekyvietė';
export const HOME_DESCRIPTION =
  'Pirkite ir parduokite išskirtinius automobilių numerius Lietuvoje. Vardiniai, motociklų, istoriniai ir numeriai su Vyčiu vienoje vietoje.';
export const OG_IMAGE_PATH = '/unikodasphoto.png';

export const SITE_URL = getSiteUrl();

type SearchParams = Record<string, string | string[] | undefined>;

type SeoDefinition = {
  title: string;
  description: string;
  path: string;
};

type CategorySeoDefinition = {
  title: string;
  description: string;
};

const PLATE_TYPE_CATEGORY_SEO: Record<PlateType, CategorySeoDefinition> = {
  personalized: {
    title: 'Personalizuoti automobilių numeriai | Unikodas',
    description:
      'Naršykite personalizuotų automobilių numerių skelbimus Lietuvoje ir susisiekite su pardavėjais per Unikodas.',
  },
  motorcycle: {
    title: 'Motociklų numeriai | Unikodas',
    description:
      'Raskite motociklų numerių skelbimus Lietuvoje ir susisiekite su pardavėjais per Unikodas.',
  },
  standard: {
    title: 'Standartiniai automobilių numeriai | Unikodas',
    description:
      'Peržiūrėkite standartinių automobilių numerių skelbimus Lietuvoje Unikodas platformoje.',
  },
  historical: {
    title: 'Istoriniai automobilių numeriai | Unikodas',
    description:
      'Naršykite istorinių automobilių numerių skelbimus Lietuvoje ir raskite tinkamą numerį Unikodas platformoje.',
  },
  other: {
    title: 'Kiti automobilių numeriai | Unikodas',
    description:
      'Peržiūrėkite kitų automobilių numerių skelbimus Lietuvoje Unikodas platformoje.',
  },
};

const FLAG_CATEGORY_SEO: Record<FlagType, CategorySeoDefinition> = {
  lithuanian_flag: {
    title: 'Numeriai su Lietuvos vėliava | Unikodas',
    description:
      'Naršykite automobilių numerių su Lietuvos vėliava skelbimus Unikodas platformoje.',
  },
  eu_symbol: {
    title: 'Numeriai su ES simboliu | Unikodas',
    description: 'Peržiūrėkite automobilių numerių su ES simboliu skelbimus Unikodas platformoje.',
  },
  vytis: {
    title: 'Numeriai su Vyčiu | Unikodas',
    description:
      'Raskite automobilių numerius su Vyčiu Lietuvoje ir susisiekite su pardavėjais per Unikodas.',
  },
};

export const SITEMAP_CATEGORY_PATHS = [
  '/?type=personalized',
  '/?type=motorcycle',
  '/?type=standard',
  '/?flag=vytis',
  '/?type=historical',
] as const;

function getSiteUrl(): URL {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const url = new URL(withProtocol);
  url.pathname = url.pathname.replace(/\/+$/, '');
  url.search = '';
  url.hash = '';
  return url;
}

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function createPageMetadata({ title, description, path }: SeoDefinition): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(OG_IMAGE_PATH);

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: 'lt_LT',
      type: 'website',
      images: [
        {
          url: imageUrl,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function getBrowseSeo(searchParams: SearchParams): SeoDefinition {
  const filters = parseListingFilters(searchParams);
  const canonicalPath = getBrowseCanonicalPath(searchParams);

  if (filters.flag_type) {
    return {
      ...FLAG_CATEGORY_SEO[filters.flag_type],
      path: canonicalPath,
    };
  }

  if (filters.plate_type) {
    return {
      ...PLATE_TYPE_CATEGORY_SEO[filters.plate_type],
      path: canonicalPath,
    };
  }

  return {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: canonicalPath,
  };
}

export function getListingSeo(id: string, plateText: string): SeoDefinition {
  return {
    title: `${plateText} – numerio skelbimas | Unikodas`,
    description: `Peržiūrėkite numerio ${plateText} skelbimą Unikodas platformoje.`,
    path: `/skelbimas/${id}`,
  };
}

function getBrowseCanonicalPath(searchParams: SearchParams): string {
  const filters = parseListingFilters(searchParams);
  const params = new URLSearchParams();

  if (filters.q) params.set('q', filters.q);
  if (filters.plate_type) params.set('type', filters.plate_type);
  if (filters.flag_type) params.set('flag', filters.flag_type);
  if (filters.city) params.set('city', filters.city);
  if (filters.minPrice !== null) params.set('min', String(filters.minPrice));
  if (filters.maxPrice !== null) params.set('max', String(filters.maxPrice));

  const query = params.toString();
  return query ? `/?${query}` : '/';
}
