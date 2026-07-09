import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { FaqAccordion } from '@/components/FaqAccordion';
import { JsonLd } from '@/components/JsonLd';
import { ListingCard } from '@/components/ListingCard';
import { LogoLink } from '@/components/LogoLink';
import { createNoIndexMetadata, createPageMetadata } from '@/lib/seo';
import {
  articleJsonLd,
  breadcrumbJsonLd,
  collectionPageJsonLd,
  faqPageJsonLd,
  itemListJsonLd,
} from '@/lib/structured-data';
import {
  getEncyclopediaTopic,
  getStaticEncyclopediaParams,
  rankTopicListings,
  type EncyclopediaTopic,
  type TopicListing,
  type TopicRelatedItem,
} from '@/lib/topic-encyclopedia';

export const revalidate = 3600;
export const dynamicParams = true;

const TELEGRAM_URL = 'https://t.me/+xweru-k3heRlMjY0';
const LISTING_CANDIDATE_LIMIT = 120;

type PageProps = {
  params: Promise<{ slug: string }>;
};

type TopicPageData = {
  topic: EncyclopediaTopic;
  listings: TopicListing[];
};

const getCachedTopicPageData = unstable_cache(
  async (slug: string) => getTopicPageData(slug),
  ['topic-encyclopedia-page'],
  { revalidate },
);

export function generateStaticParams() {
  return getStaticEncyclopediaParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getEncyclopediaTopic(slug);

  if (!topic) {
    return createNoIndexMetadata({
      title: 'Tema nerasta | Unikodas',
      description: 'Šiai temai dar nėra pakankamai Unikodas žinių bazės duomenų.',
      path: `/tema/${slug}`,
    });
  }

  return createPageMetadata({
    title: topic.seoTitle,
    description: truncateMeta(topic.description),
    path: `/tema/${topic.slug}`,
    keywords: topic.keywords,
  });
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getCachedTopicPageData(slug);
  if (!data) notFound();

  const { topic, listings } = data;
  const path = `/tema/${topic.slug}`;
  const shortDescription = truncateMeta(topic.description, 220);
  const schema = [
    collectionPageJsonLd({
      name: topic.title,
      description: shortDescription,
      path,
    }),
    articleJsonLd({
      headline: topic.title,
      description: shortDescription,
      path,
    }),
    faqPageJsonLd(topic.faqs),
    breadcrumbJsonLd([
      { name: 'Numeriai', path: '/' },
      { name: 'Unikodas enciklopedija', path: '/numerio-verte' },
      { name: topic.title, path },
    ]),
    ...(listings.length > 0
      ? [
          itemListJsonLd({
            name: `${topic.title} skelbimai`,
            path,
            listings,
          }),
        ]
      : []),
  ];

  return (
    <>
      <JsonLd data={schema} />

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <LogoLink />
          <Link
            href="/numerio-analize"
            className="hidden rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] sm:inline-flex"
          >
            Analizuoti numerį
          </Link>
        </nav>
      </header>

      <main className="app-shell">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <section className="app-card overflow-hidden p-5 sm:p-8">
            <p className="text-sm font-black uppercase text-[var(--primary)]">
              Unikodas enciklopedija
            </p>
            <div className="mt-4 grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
              <div>
                <h1 className="text-[clamp(2.3rem,10vw,4.5rem)] font-black leading-tight tracking-tight text-[var(--foreground)]">
                  {topic.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                  {topic.description}
                </p>
              </div>
              <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--muted)] p-5">
                <p className="text-xs font-black uppercase text-[var(--muted-soft)]">Tema</p>
                <p className="mt-2 text-4xl font-black text-[var(--primary)]">
                  {topic.entry.keyword}
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  {topic.entry.collectorNotes}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/numerio-analize?plate=${encodeURIComponent(topic.entry.keyword)}&auto=1`}
                className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
              >
                Analizuoti numerį
              </Link>
              <Link
                href={`/parduoti?plate=${encodeURIComponent(topic.entry.keyword)}`}
                className="app-button-secondary min-h-[52px] px-5 py-3 text-center text-sm"
              >
                Parduoti numerį
              </Link>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
            <article className="app-card p-5 sm:p-6">
              <p className="text-sm font-black uppercase text-[var(--primary)]">Paaiškinimas</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Kodėl ši tema svarbi numeriuose?
              </h2>
              <div className="mt-4 space-y-4 text-base leading-7 text-[var(--muted-foreground)]">
                {topic.intro.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </article>

            <article className="app-card p-5 sm:p-6">
              <p className="text-sm font-black uppercase text-[var(--primary)]">Įdomūs faktai</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Ką verta žinoti?
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted-foreground)]">
                {topic.facts.map((fact) => (
                  <li key={fact} className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-3">
                    {fact}
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="app-card p-5 sm:p-6" aria-labelledby="graph-title">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Žinių grafas</p>
            <h2 id="graph-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
              Susijusios reikšmės
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              Unikodas sieja temas pagal žinių bazės ryšius, bendras žymas,
              automobilių asociacijas ir numerių analizės rezultatus.
            </p>
            <KnowledgeGraph items={topic.knowledgeGraph} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <RelatedPanel title="Susijusios analizės" items={topic.relatedAnalyses} empty="Šiai temai dar nėra pakankamai susijusių analizės puslapių." />
            <RelatedPanel title="Susijusios temos" items={topic.relatedTopics} empty="Aiškių susijusių temų dar nėra." />
          </section>

          <section className="space-y-4" aria-labelledby="marketplace-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Prekyvietė</p>
                <h2 id="marketplace-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  {topic.title} pardavimui
                </h2>
              </div>
              <Link href="/" className="app-button-secondary min-h-11 px-4 py-2 text-center text-sm">
                Visi skelbimai
              </Link>
            </div>
            {listings.length > 0 ? (
              <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="app-card border-dashed p-6 text-center">
                <h3 className="text-xl font-black text-[var(--foreground)]">
                  Aktyvių susijusių skelbimų neradome
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Jei turite numerį, susijusį su šia tema, galite įkelti skelbimą
                  ir leisti pirkėjams jus surasti.
                </p>
                <Link href="/parduoti" className="app-button-primary mt-4 min-h-11 px-4 py-2 text-sm">
                  Įkelti skelbimą
                </Link>
              </div>
            )}
          </section>

          <section className="app-card p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Kitas žingsnis</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Tyrinėkite, parduokite arba klauskite bendruomenės
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Analizuokite konkretų numerį, paskelbkite savo derinį arba
                  gaukite automobilių entuziastų nuomonę Unikodas Telegram grupėje.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
                <Link href="/numerio-analize" className="app-button-secondary px-4 py-3 text-center text-sm">
                  Analizuoti
                </Link>
                <Link href="/parduoti" className="app-button-primary px-4 py-3 text-center text-sm">
                  Parduoti
                </Link>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="app-button-secondary px-4 py-3 text-center text-sm"
                >
                  Telegram
                </a>
              </div>
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="faq-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">DUK</p>
              <h2 id="faq-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Dažniausiai klausimai apie {topic.entry.displayName}
              </h2>
            </div>
            <FaqAccordion items={topic.faqs} />
          </section>

          <section className="app-card p-5 sm:p-6" aria-labelledby="internal-links-title">
            <h2 id="internal-links-title" className="text-2xl font-black text-[var(--foreground)]">
              Toliau tyrinėkite Unikodas
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InternalLink href="/numerio-verte" label="Numerio vertė" />
              <InternalLink href="/numerio-analize" label="Numerio analizė" />
              <InternalLink href="/idomiausi-numeriai" label="Įdomiausi numeriai" />
              <InternalLink href="/kaip-parduoti-numeri" label="Kaip parduoti numerį" />
              <InternalLink href="/vardiniai-numeriai" label="Vardiniai numeriai" />
              <InternalLink href="/motociklu-numeriai" label="Motociklų numeriai" />
              <InternalLink href="/" label="Visi skelbimai" />
              <InternalLink href="/parduoti" label="Parduoti numerį" />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

async function getTopicPageData(slug: string): Promise<TopicPageData | null> {
  const topic = getEncyclopediaTopic(slug);
  if (!topic) return null;

  const candidates = await getListingCandidates();
  return {
    topic,
    listings: rankTopicListings(topic, candidates),
  };
}

async function getListingCandidates(): Promise<TopicListing[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from('listings')
    .select('id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(LISTING_CANDIDATE_LIMIT)
    .returns<TopicListing[]>();

  if (error) {
    console.info('[topic-encyclopedia] listing lookup skipped:', error.message);
    return [];
  }

  return data ?? [];
}

function KnowledgeGraph({ items }: { items: TopicRelatedItem[] }) {
  if (items.length === 0) {
    return (
      <p className="mt-4 rounded-3xl bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
        Šiai temai dar nėra pakankamai ryšių žinių bazėje.
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <div key={`${item.href}-${index}`} className="flex items-center gap-2">
          <Link
            href={item.href}
            className="rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 py-3 text-sm font-black text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            {item.label}
          </Link>
          {index < items.length - 1 && (
            <span className="text-sm font-black text-[var(--muted-soft)]" aria-hidden="true">
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function RelatedPanel({
  title,
  items,
  empty,
}: {
  title: string;
  items: TopicRelatedItem[];
  empty: string;
}) {
  return (
    <section className="app-card p-5 sm:p-6">
      <h2 className="text-2xl font-black text-[var(--foreground)]">{title}</h2>
      {items.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.slice(0, 8).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4 transition hover:border-[var(--primary)]"
            >
              <span className="block text-lg font-black text-[var(--foreground)]">{item.label}</span>
              <span className="mt-1 block text-xs font-bold uppercase text-[var(--muted-soft)]">
                {item.kind === 'plate' ? 'Numerio analizė' : 'Enciklopedijos tema'}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">{empty}</p>
      )}
    </section>
  );
}

function InternalLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm font-black text-[var(--foreground)] transition hover:border-[var(--primary)]"
    >
      {label}
    </Link>
  );
}

function truncateMeta(value: string, max = 158): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
