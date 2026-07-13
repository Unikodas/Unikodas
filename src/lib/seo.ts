import type { Metadata } from 'next';
import { parseListingFilters, type FlagType, type PlateType } from '@/lib/validation/listing';

export const SITE_NAME = 'Unikodas';
export const DEFAULT_SITE_URL = 'https://unikodas.lt';
export const HOME_TITLE = 'Unikodas – automobilių numerių skelbimų platforma';
export const HOME_DESCRIPTION =
  'Naršykite automobilių numerių kombinacijų skelbimus Lietuvoje, naudokite Unikodas įžvalgas, bendraukite per vidines žinutes ir formalumus tvarkykite oficialia tvarka.';
export const OG_IMAGE_PATH = '/og-image.png';

export const SITE_URL = getSiteUrl();

type SearchParams = Record<string, string | string[] | undefined>;

type SeoDefinition = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  robots?: Metadata['robots'];
  imagePath?: string;
};

type CategorySeoDefinition = {
  title: string;
  description: string;
  keywords?: string[];
};

const PLATE_TYPE_CATEGORY_SEO: Record<PlateType, CategorySeoDefinition> = {
  personalized: {
    title: 'Personalizuoti automobilių numeriai | Unikodas',
    description:
      'Atraskite vardinius, lengvai įsimenamus ir personalizuotus automobilių numerius Lietuvoje. Peržiūrėkite skelbimus ir susisiekite per Unikodas.',
    keywords: ['vardiniai numeriai', 'personalizuoti numeriai', 'automobilių numeriai'],
  },
  motorcycle: {
    title: 'Motociklų numeriai | Unikodas',
    description:
      'Peržiūrėkite motociklų numerių skelbimus Lietuvoje, raskite įsimenamą derinį ir susisiekite su pardavėju per Unikodas žinutes.',
    keywords: ['motociklų numeriai', 'motociklo numeriai', 'motociklo valstybiniai numeriai'],
  },
  standard: {
    title: 'Standartiniai automobilių numeriai | Unikodas',
    description:
      'Naršykite standartinių automobilių numerių skelbimus, palyginkite kainas ir raskite jums tinkantį derinį Unikodas prekyvietėje.',
    keywords: ['automobilių numeriai', 'valstybiniai numeriai', 'numerių skelbimai'],
  },
  historical: {
    title: 'Istoriniai automobilių numeriai | Unikodas',
    description:
      'Ieškote istorinio automobilio numerio? Peržiūrėkite aktyvius skelbimus Lietuvoje ir bendraukite su pardavėjais per Unikodas.',
    keywords: ['istoriniai numeriai', 'istorinių automobilių numeriai'],
  },
  other: {
    title: 'Kiti automobilių numeriai | Unikodas',
    description:
      'Peržiūrėkite įvairių formatų automobilių numerių skelbimus Lietuvoje ir raskite derinį, kurio nėra įprastose kategorijose.',
    keywords: ['automobilių numeriai', 'numerių prekyvietė'],
  },
};

const FLAG_CATEGORY_SEO: Record<FlagType, CategorySeoDefinition> = {
  lithuanian_flag: {
    title: 'Numeriai su Lietuvos vėliava | Unikodas',
    description:
      'Raskite automobilių numerius su Lietuvos vėliava, palyginkite aktyvius skelbimus ir susisiekite su pardavėjais per Unikodas.',
    keywords: ['numeriai su Lietuvos vėliava', 'lietuviški numeriai'],
  },
  eu_symbol: {
    title: 'Numeriai su ES simboliu | Unikodas',
    description:
      'Peržiūrėkite automobilių numerius su ES simboliu, raskite patrauklų derinį ir bendraukite su pardavėju Unikodas platformoje.',
    keywords: ['numeriai su ES simboliu', 'automobilių numeriai'],
  },
  vytis: {
    title: 'Numeriai su Vyčiu | Unikodas',
    description:
      'Atraskite automobilių numerius su Vyčiu Lietuvoje, palyginkite skelbimus ir susisiekite su pardavėjais per saugias vidines žinutes.',
    keywords: ['numeriai su Vyčiu', 'automobilių numeriai su Vyčiu'],
  },
};

export const SITEMAP_CATEGORY_PATHS = [
  '/?type=personalized',
  '/?type=motorcycle',
  '/?type=standard',
  '/?flag=vytis',
  '/?type=historical',
] as const;

export const DEFAULT_INDEX_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

export const NO_INDEX_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

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

export function createPageMetadata({
  title,
  description,
  path,
  keywords,
  robots = DEFAULT_INDEX_ROBOTS,
  imagePath = OG_IMAGE_PATH,
}: SeoDefinition): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(imagePath);

  return {
    title: { absolute: title },
    description,
    keywords,
    robots,
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

export function createNoIndexMetadata({
  title,
  description,
  path,
}: Omit<SeoDefinition, 'robots'>): Metadata {
  return createPageMetadata({
    title,
    description,
    path,
    robots: NO_INDEX_ROBOTS,
  });
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
    keywords: ['automobilių numeriai', 'numerių skelbimai', 'vardiniai numeriai', 'unikalūs numeriai'],
  };
}

export function getListingSeo(id: string, plateText: string): SeoDefinition {
  return {
    title: `${plateText} – numerio skelbimas | Unikodas`,
    description: `Peržiūrėkite automobilio numerio ${plateText} skelbimą: kaina, miestas, aprašymas ir saugus susisiekimas su pardavėju per Unikodas.`,
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
