import { absoluteUrl, OG_IMAGE_PATH, SITE_NAME, SITE_URL } from '@/lib/seo';

const CONTEXT = 'https://schema.org';
const TELEGRAM_URL = 'https://t.me/+xweru-k3heRlMjY0';

type BreadcrumbItem = {
  name: string;
  path: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type ListingSchemaInput = {
  id: string;
  plateText: string;
  priceEur: number | null;
  description?: string | null;
  city?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type ItemListListing = {
  id: string;
  plate_text: string;
  price_eur?: number | null;
  city?: string | null;
};

export function organizationJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL.toString(),
    logo: absoluteUrl('/icon-512.png'),
    sameAs: [TELEGRAM_URL],
  };
}

export function websiteJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL.toString(),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(items: FaqItem[]) {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function articleJsonLd({
  headline,
  description,
  path,
}: {
  headline: string;
  description: string;
  path: string;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'Article',
    headline,
    description,
    inLanguage: 'lt-LT',
    mainEntityOfPage: absoluteUrl(path),
    publisher: organizationJsonLd(),
    image: absoluteUrl(OG_IMAGE_PATH),
  };
}

export function collectionPageJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'CollectionPage',
    name,
    description,
    inLanguage: 'lt-LT',
    url: absoluteUrl(path),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL.toString(),
    },
  };
}

export function searchResultsPageJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    '@context': CONTEXT,
    '@type': 'SearchResultsPage',
    name,
    description,
    inLanguage: 'lt-LT',
    url: absoluteUrl(path),
  };
}

export function softwareApplicationJsonLd() {
  return {
    '@context': CONTEXT,
    '@type': 'SoftwareApplication',
    name: 'Unikodas numerio analizė',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: absoluteUrl('/numerio-analize'),
    description:
      'Unikodas įžvalgos analizuoja numerio raštus, paslėptas reikšmes, vardus ir automobilių asociacijas.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
  };
}

export function productJsonLd(listing: ListingSchemaInput) {
  const product: Record<string, unknown> = {
    '@context': CONTEXT,
    '@type': 'Product',
    name: `${listing.plateText} automobilio numeris`,
    description:
      listing.description ||
      `Automobilio numerio ${listing.plateText} skelbimas Unikodas prekyvietėje.`,
    category: 'Vehicle number plate',
    url: absoluteUrl(`/skelbimas/${listing.id}`),
    image: absoluteUrl(OG_IMAGE_PATH),
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Numeris',
        value: listing.plateText,
      },
      listing.city
        ? {
            '@type': 'PropertyValue',
            name: 'Miestas',
            value: listing.city,
          }
        : null,
    ].filter(Boolean),
  };

  if (listing.priceEur !== null) {
    product.offers = {
      '@type': 'Offer',
      url: absoluteUrl(`/skelbimas/${listing.id}`),
      priceCurrency: 'EUR',
      price: listing.priceEur,
      availability:
        listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/UsedCondition',
    };
  }

  if (listing.createdAt) {
    product.releaseDate = listing.createdAt;
  }

  return product;
}

export function itemListJsonLd({
  name,
  path,
  listings,
}: {
  name: string;
  path: string;
  listings: ItemListListing[];
}) {
  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    name,
    url: absoluteUrl(path),
    numberOfItems: listings.length,
    itemListElement: listings.map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absoluteUrl(`/skelbimas/${listing.id}`),
      item: {
        '@type': 'Product',
        name: `${listing.plate_text} automobilio numeris`,
        url: absoluteUrl(`/skelbimas/${listing.id}`),
        offers:
          listing.price_eur !== null && listing.price_eur !== undefined
            ? {
                '@type': 'Offer',
                priceCurrency: 'EUR',
                price: listing.price_eur,
              }
            : undefined,
      },
    })),
  };
}
