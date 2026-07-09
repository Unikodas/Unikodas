import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { FaqAccordion } from '@/components/FaqAccordion';
import { JsonLd } from '@/components/JsonLd';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { generateAiPlateAnalysis, hasOpenAiPlateAnalysisConfig, type AiPlateAnalysis } from '@/lib/ai-plate-analysis';
import {
  analyzePlate,
  normalizePlate,
  type MeaningCategory,
  type PlateAnalysis,
  type PlateAnalysisContext,
  type PlateMeaning,
} from '@/lib/plate-intelligence';
import { KNOWLEDGE_BASE, searchKnowledgeIndex } from '@/lib/plate-intelligence/database';
import { createPageMetadata, createNoIndexMetadata } from '@/lib/seo';
import { breadcrumbJsonLd, faqPageJsonLd, productJsonLd, articleJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { FlagType, PlateType } from '@/lib/validation/listing';
import { PlatePageAnalytics } from './PlatePageAnalytics';

export const revalidate = 3600;

const TELEGRAM_URL = 'https://t.me/+xweru-k3heRlMjY0';
const SIMILAR_LISTING_LIMIT = 6;

type PageProps = {
  params: Promise<{ plate: string }>;
};

type PlateListingRow = ListingCardData;

type PlatePageData = {
  plate: string;
  analysis: PlateAnalysis;
  exactListing: PlateListingRow | null;
  similarListings: PlateListingRow[];
  relatedPlates: string[];
  hasAnalysisEvent: boolean;
  hasKnowledgeMatch: boolean;
};

type MeaningGroups = {
  automotive: PlateMeaning[];
  hiddenNames: PlateMeaning[];
  hiddenWords: PlateMeaning[];
  patterns: PlateMeaning[];
};

const categoryLabels: Record<MeaningCategory, string> = {
  PERSON_NAME: 'Vardas',
  CAR_MODEL: 'Automobilio modelis',
  CAR_BRAND: 'Automobilio markė',
  CITY: 'Miestas',
  BUSINESS: 'Verslo reikšmė',
  COMMON_WORD: 'Žodis',
  PERFORMANCE: 'Performance',
  NUMBER_PATTERN: 'Raštas',
  LUXURY: 'Premium',
};

const getCachedPlatePageData = unstable_cache(
  async (rawPlate: string) => getPlatePageData(rawPlate),
  ['dynamic-plate-page'],
  { revalidate },
);

const getCachedAiAnalysis = unstable_cache(
  async (
    plate: string,
    context: PlateAnalysisContext,
  ): Promise<AiPlateAnalysis | null> => {
    if (!hasOpenAiPlateAnalysisConfig()) return null;
    const analysis = analyzePlate(plate, context);
    try {
      return await generateAiPlateAnalysis({
        plate,
        normalizedPlate: normalizePlate(plate),
        ruleAnalysis: analysis,
        context,
      });
    } catch (error) {
      console.info('[dynamic-plate] AI explanation skipped:', error);
      return null;
    }
  },
  ['dynamic-plate-ai'],
  { revalidate: 86400 },
);

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { plate } = await params;
  const data = await getCachedPlatePageData(plate);

  if (!data) {
    return createNoIndexMetadata({
      title: 'Numeris nerastas | Unikodas',
      description: 'Šiam numeriui dar nėra pakankamai Unikodas įžvalgų.',
      path: `/numerio/${normalizePlate(plate) || plate}`,
    });
  }

  const title = `${data.plate} numerio reikšmė ir vertė | Unikodas`;
  const primaryMeaning = data.analysis.topMeanings[0]?.text;
  const description = primaryMeaning
    ? `Sužinokite, kuo ${data.plate} gali būti įdomus: ${primaryMeaning}, kolekcinės įžvalgos, panašūs numeriai ir aktyvūs skelbimai Unikodas.`
    : `Sužinokite, kokius raštus, reikšmes ir kolekcinį patrauklumą gali turėti ${data.plate} numeris.`;

  return createPageMetadata({
    title,
    description,
    path: `/numerio/${data.plate}`,
    keywords: [
      `${data.plate} numeris`,
      `${data.plate} reikšmė`,
      `${data.plate} vertė`,
      'automobilio numerio vertė',
    ],
  });
}

export default async function DynamicPlatePage({ params }: PageProps) {
  const { plate } = await params;
  const data = await getCachedPlatePageData(plate);
  if (!data) notFound();

  const context = getAnalysisContext(data.exactListing);
  const aiAnalysis = await getCachedAiAnalysis(data.plate, context);
  const meaningGroups = groupMeanings(data.analysis.topMeanings);
  const faqs = buildFaqs(data.plate, data.analysis, meaningGroups);
  const scoreDescription = getScoreDescription(data.analysis.score);

  const schema = [
    articleJsonLd({
      headline: `${data.plate} numerio reikšmė ir vertė`,
      description: `Unikodas įžvalgos apie ${data.plate}: galimos reikšmės, kolekcinis patrauklumas, auditorija ir panašūs numeriai.`,
      path: `/numerio/${data.plate}`,
    }),
    faqPageJsonLd(faqs),
    breadcrumbJsonLd([
      { name: 'Numeriai', path: '/' },
      { name: 'Numerio vertė', path: '/numerio-verte' },
      { name: data.plate, path: `/numerio/${data.plate}` },
    ]),
    itemListJsonLd({
      name: `Panašūs ${data.plate} skelbimai`,
      path: `/numerio/${data.plate}`,
      listings: data.similarListings,
    }),
    ...(data.exactListing
      ? [
          productJsonLd({
            id: data.exactListing.id,
            plateText: data.exactListing.plate_text,
            priceEur: data.exactListing.price_eur,
            description: data.exactListing.description,
            city: data.exactListing.city,
            status: 'active',
            createdAt: data.exactListing.created_at,
          }),
        ]
      : []),
  ];

  return (
    <>
      <JsonLd data={schema} />
      <PlatePageAnalytics plate={data.plate} score={data.analysis.score} />

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <LogoLink />
          <Link
            href={`/numerio-analize?plate=${encodeURIComponent(data.plate)}&auto=1`}
            data-plate-event="analysis_open"
            className="hidden rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] sm:inline-flex"
          >
            Analizuoti
          </Link>
        </nav>
      </header>

      <main className="app-shell">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <section className="app-card grid gap-7 overflow-hidden p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase text-[var(--primary)]">
                Unikodas numerio puslapis
              </p>
              <h1 className="mt-3 text-[clamp(2.1rem,9vw,4rem)] font-black leading-tight text-[var(--foreground)]">
                {data.plate} numerio reikšmė ir įžvalgos
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                Šis puslapis sukurtas tik tada, kai Unikodas turi pakankamai
                duomenų arba įžvalgų apie derinį. Vertė nėra garantuota: ji
                priklauso nuo paklausos, pirkėjo ir to, kam šis numeris turi
                prasmę.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {data.analysis.badges.slice(0, 6).map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-[var(--border)] bg-[var(--muted)] px-3 py-1 text-xs font-bold text-[var(--foreground)]"
                  >
                    {badge}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={`/numerio-analize?plate=${encodeURIComponent(data.plate)}&auto=1`}
                  data-plate-event="analysis_open"
                  className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Analizuoti kitą numerį
                </Link>
                <Link
                  href={`/parduoti?plate=${encodeURIComponent(data.plate)}`}
                  data-plate-event="sell_click"
                  className="app-button-secondary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Parduoti šį numerį
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] p-5">
              <PlatePreview
                plateText={data.plate}
                plateType={data.exactListing?.plate_type ?? 'personalized'}
                flagType={data.exactListing?.flag_type ?? 'eu_symbol'}
                size="lg"
                className="plate-preview--hero"
              />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="app-card p-5">
              <p className="text-sm font-black uppercase text-[var(--primary)]">Balai</p>
              <div className="mt-4 grid gap-3">
                <ScoreBox label="Įdomumo balas" value={data.analysis.score} text={data.analysis.label} />
                <ScoreBox
                  label="Kolekcinis balas"
                  value={data.analysis.dimensions.collectorAppeal}
                  text={scoreDescription}
                />
              </div>
            </div>

            <section className="app-card p-5 sm:p-6" aria-labelledby="insights-title">
              <p className="text-sm font-black uppercase text-[var(--primary)]">
                Unikodas Insights
              </p>
              <h2 id="insights-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Ką Unikodas aptiko šiame numeryje?
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <MeaningGroup title="Top reikšmės" meanings={data.analysis.topMeanings} empty="Aiškių reikšmių neaptikta." />
                <MeaningGroup title="Automobilių nuorodos" meanings={meaningGroups.automotive} empty="Stiprių automobilių nuorodų neaptikta." />
                <MeaningGroup title="Paslėpti vardai" meanings={meaningGroups.hiddenNames} empty="Paslėptų vardų neaptikta." />
                <MeaningGroup title="Paslėpti žodžiai" meanings={meaningGroups.hiddenWords} empty="Paslėptų žodžių neaptikta." />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextList
                  title="Pasikartojimai ir raštai"
                  items={meaningGroups.patterns.map((meaning) => meaning.reason)}
                  fallback={getPatternFallback(data.plate)}
                />
                <TextList
                  title="Simbolio įžvalgos"
                  items={data.analysis.symbolInsights}
                  fallback="Simbolio vertė priklauso nuo pasirinkto formato: ES, Vytis ar Lietuvos vėliava gali pakeisti vizualų įspūdį."
                />
              </div>

              <TextList
                title="Kam gali būti patrauklus?"
                items={data.analysis.audienceInsights}
                className="mt-4"
              />
            </section>
          </section>

          <section className="app-card p-5 sm:p-6" aria-labelledby="ai-title">
            <p className="text-sm font-black uppercase text-[var(--primary)]">AI paaiškinimas</p>
            <h2 id="ai-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
              Kodėl {data.plate} gali būti įdomus?
            </h2>
            {aiAnalysis ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div>
                  <p className="text-base leading-7 text-[var(--muted-foreground)]">
                    {aiAnalysis.summary}
                  </p>
                  <p className="mt-4 text-base leading-7 text-[var(--muted-foreground)]">
                    {aiAnalysis.collectorAppeal}
                  </p>
                </div>
                <div className="rounded-3xl bg-[var(--muted)] p-4">
                  <h3 className="text-sm font-black text-[var(--foreground)]">AI pastebėjimai</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {[...aiAnalysis.hiddenMeanings, ...aiAnalysis.suggestions].slice(0, 5).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-base leading-7 text-[var(--muted-foreground)]">
                {data.analysis.collectorInsights.slice(0, 4).map((insight) => (
                  <p key={insight}>{insight}</p>
                ))}
                <p>
                  AI paaiškinimas šiuo metu nepasiekiamas, todėl rodoma taisyklėmis
                  paremta Unikodas analizė. Ji nevertina kainos, o paaiškina, kokie
                  derinio bruožai gali būti pastebimi pirkėjams ar kolekcininkams.
                </p>
              </div>
            )}
          </section>

          <section className="app-card p-5 sm:p-6" aria-labelledby="collector-title">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Kolekcinė logika</p>
            <h2 id="collector-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
              Ne tik kas aptikta, bet ir kodėl tai svarbu
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.analysis.collectorInsights.slice(0, 6).map((insight) => (
                <article key={insight} className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4">
                  <p className="text-sm leading-6 text-[var(--muted-foreground)]">{insight}</p>
                </article>
              ))}
            </div>
            <p className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs leading-5 text-[var(--muted-foreground)]">
              Tai nėra oficialus vertinimas ar garantuota rinkos kaina. Numerio
              vertė priklauso nuo paklausos ir konkretaus pirkėjo.
            </p>
          </section>

          <section className="space-y-4" aria-labelledby="related-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Panašios idėjos</p>
              <h2 id="related-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Susiję numeriai
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.relatedPlates.map((related) => (
                <Link
                  key={related}
                  href={`/numerio/${related}`}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-4 transition hover:border-[var(--primary)]"
                >
                  <span className="block text-2xl font-black text-[var(--foreground)]">{related}</span>
                  <span className="mt-2 block text-sm leading-6 text-[var(--muted-foreground)]">
                    Panaši reikšmė, raštas arba automobilių asociacija.
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="marketplace-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Prekyvietė</p>
                <h2 id="marketplace-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Panašūs aktyvūs skelbimai
                </h2>
              </div>
              <Link href="/" className="app-button-secondary min-h-11 px-4 py-2 text-center text-sm">
                Visi skelbimai
              </Link>
            </div>
            {data.similarListings.length > 0 ? (
              <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.similarListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="app-card border-dashed p-6 text-center">
                <h3 className="text-xl font-black text-[var(--foreground)]">
                  Panašių aktyvių skelbimų neradome
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Jei turite šį ar panašų numerį, galite įkelti skelbimą ir
                  leisti pirkėjams jus surasti.
                </p>
              </div>
            )}
          </section>

          <section className="app-card p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Kitas žingsnis</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Ką daryti su {data.plate}?
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Patikrinkite kitą numerį, įkelkite skelbimą arba gaukite
                  bendruomenės nuomonę Telegram grupėje.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[34rem]">
                <Link
                  href={`/numerio-analize?plate=${encodeURIComponent(data.plate)}&auto=1`}
                  data-plate-event="analysis_open"
                  className="app-button-secondary px-4 py-3 text-center text-sm"
                >
                  Analizuoti
                </Link>
                <Link
                  href={`/parduoti?plate=${encodeURIComponent(data.plate)}`}
                  data-plate-event="sell_click"
                  className="app-button-primary px-4 py-3 text-center text-sm"
                >
                  Parduoti
                </Link>
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-plate-event="telegram_click"
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
                Klausimai apie {data.plate}
              </h2>
            </div>
            <FaqAccordion items={faqs} />
          </section>

          <section className="app-card p-5 sm:p-6" aria-labelledby="internal-links-title">
            <h2 id="internal-links-title" className="text-2xl font-black text-[var(--foreground)]">
              Toliau tyrinėkite Unikodas
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InternalLink href="/numerio-verte" label="Numerio vertė" />
              <InternalLink href="/numerio-analize" label="Numerio analizė" />
              <InternalLink href="/idomiausi-numeriai" label="Įdomiausi numeriai" />
              <InternalLink href="/vardiniai-numeriai" label="Vardiniai numeriai" />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

async function getPlatePageData(rawPlate: string): Promise<PlatePageData | null> {
  const plate = normalizePlate(decodeURIComponent(rawPlate));
  if (!plate || plate.length > 15) return null;

  const exactListing = await findExactListing(plate);
  const context = getAnalysisContext(exactListing);
  const analysis = analyzePlate(plate, context);
  const [hasAnalysisEvent, knowledgeMatches, similarListings] = await Promise.all([
    hasPlateAnalysisEvent(plate),
    Promise.resolve(searchKnowledgeIndex(KNOWLEDGE_BASE.index, plate)),
    findSimilarListings(plate, analysis, exactListing?.id ?? null),
  ]);

  const hasKnowledgeMatch = knowledgeMatches.some((match) => match.confidence >= 76);
  const usefulAnalysis = hasUsefulAnalysis(plate, analysis);
  const hasListing = Boolean(exactListing);

  if (!hasListing && !hasAnalysisEvent && !hasKnowledgeMatch && !usefulAnalysis) {
    return null;
  }

  return {
    plate,
    analysis,
    exactListing,
    similarListings,
    relatedPlates: buildRelatedPlates(plate, analysis),
    hasAnalysisEvent,
    hasKnowledgeMatch,
  };
}

function getAnalysisContext(listing: PlateListingRow | null): PlateAnalysisContext {
  return {
    symbol: mapFlagToSymbol(listing?.flag_type),
    type: listing?.plate_type ?? null,
  };
}

function createPublicSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function findExactListing(plate: string): Promise<PlateListingRow | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('listings')
    .select('id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at')
    .eq('status', 'active')
    .ilike('plate_text', plate)
    .order('created_at', { ascending: false })
    .limit(1)
    .returns<PlateListingRow[]>();

  if (error) {
    console.info('[dynamic-plate] exact listing lookup skipped:', error.message);
    return null;
  }

  return data?.[0] ?? null;
}

async function findSimilarListings(
  plate: string,
  analysis: PlateAnalysis,
  exactListingId: string | null,
): Promise<PlateListingRow[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('listings')
    .select('id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(80)
    .returns<PlateListingRow[]>();

  if (error) {
    console.info('[dynamic-plate] similar listing lookup skipped:', error.message);
    return [];
  }

  const meaningTexts = new Set(analysis.topMeanings.map((meaning) => meaning.text));
  const related = new Set(buildRelatedPlates(plate, analysis));
  const plateLetters = plate.replace(/\d/g, '');
  const plateDigits = plate.replace(/[A-Z]/g, '');

  return (data ?? [])
    .filter((listing) => listing.id !== exactListingId)
    .map((listing) => {
      const normalized = normalizePlate(listing.plate_text);
      const listingAnalysis = analyzePlate(normalized, {
        symbol: mapFlagToSymbol(listing.flag_type),
        type: listing.plate_type,
      });
      const sharedMeaning = listingAnalysis.topMeanings.some((meaning) => meaningTexts.has(meaning.text));
      const relatedMatch = related.has(normalized);
      const sameLetters = plateLetters.length >= 2 && normalized.includes(plateLetters.slice(0, 3));
      const sameDigits = plateDigits.length >= 2 && normalized.includes(plateDigits.slice(0, 3));
      const directOverlap = plate.includes(normalized) || normalized.includes(plate);
      const similarity =
        (sharedMeaning ? 40 : 0) +
        (relatedMatch ? 36 : 0) +
        (directOverlap ? 24 : 0) +
        (sameLetters ? 12 : 0) +
        (sameDigits ? 10 : 0) +
        Math.min(20, listingAnalysis.score / 5);
      return { listing, similarity };
    })
    .filter((item) => item.similarity >= 18)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, SIMILAR_LISTING_LIMIT)
    .map((item) => item.listing);
}

async function hasPlateAnalysisEvent(plate: string): Promise<boolean> {
  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from('plate_analysis_events')
      .select('id')
      .eq('normalized_plate', plate)
      .limit(1);

    if (error) {
      console.info('[dynamic-plate] analysis event lookup skipped:', error.message);
      return false;
    }

    return Boolean(data?.length);
  } catch (error) {
    console.info('[dynamic-plate] analysis event lookup unavailable:', error);
    return false;
  }
}

function hasUsefulAnalysis(plate: string, analysis: PlateAnalysis): boolean {
  const hasRepeated = /([A-Z])\1{2,}/.test(plate.replace(/\d/g, '')) || /(\d)\1{2,}/.test(plate);
  const hasStrongMeaning = analysis.topMeanings.some((meaning) => meaning.confidence >= 82);
  const hasMultipleMeanings = analysis.topMeanings.length >= 2 && analysis.score >= 30;
  return analysis.score >= 42 || hasRepeated || hasStrongMeaning || hasMultipleMeanings;
}

function mapFlagToSymbol(flagType?: FlagType | null): PlateAnalysisContext['symbol'] {
  if (flagType === 'vytis') return 'vytis';
  if (flagType === 'lithuanian_flag') return 'flag';
  if (flagType === 'eu_symbol') return 'eu';
  return null;
}

function groupMeanings(meanings: PlateMeaning[]): MeaningGroups {
  return {
    automotive: meanings.filter((meaning) =>
      ['CAR_MODEL', 'CAR_BRAND', 'PERFORMANCE'].includes(meaning.category),
    ),
    hiddenNames: meanings.filter((meaning) => meaning.category === 'PERSON_NAME'),
    hiddenWords: meanings.filter((meaning) =>
      ['COMMON_WORD', 'BUSINESS', 'LUXURY', 'CITY'].includes(meaning.category),
    ),
    patterns: meanings.filter((meaning) => meaning.category === 'NUMBER_PATTERN'),
  };
}

function buildRelatedPlates(plate: string, analysis: PlateAnalysis): string[] {
  const related: string[] = [];
  const add = (value: string) => {
    const normalized = normalizePlate(value).slice(0, 8);
    if (normalized && normalized !== plate && !related.includes(normalized)) related.push(normalized);
  };

  analysis.similarPlateIdeas.forEach(add);

  const bmw = plate.match(/^BMW([1-8]\d{2})$/);
  if (bmw) {
    const model = bmw[1];
    const series = model[0];
    [`BMW${series}35`, `BMW${series}40`, `BMW${series}50`, `M${series}50`, `M${series}`, `${model}D`, `${model}I`].forEach(add);
  }

  if (/^RS[3-7]$/.test(plate)) {
    ['RS3', 'RS4', 'RS5', 'RS6', 'RS7', `S${plate.slice(2)}`, `AUDI${plate}`].forEach(add);
  }

  if (/^AMG0?63$/.test(plate) || /^AMG/.test(plate)) {
    ['AMG63', 'S63', 'C63', 'G63', 'AMG53', 'AMG43'].forEach(add);
  }

  if (/^GT[234]$/.test(plate)) {
    ['GT2', 'GT3', 'GT4', 'POR911', '911GT3'].forEach(add);
  }

  if (/(\d)\1{2,}/.test(plate)) {
    const repeated = plate.match(/(\d)\1{2,}/)?.[0] ?? '777';
    [`VIP${repeated}`, `AAA${repeated}`, `TOP${repeated}`, `BMW${repeated}`].forEach(add);
  }

  const nameMeaning = analysis.topMeanings.find((meaning) => meaning.category === 'PERSON_NAME');
  if (nameMeaning) {
    const prefix = normalizePlate(nameMeaning.text).slice(0, 3);
    [`${prefix}777`, `${prefix}111`, `${prefix}444`, nameMeaning.text].forEach(add);
  }

  if (related.length < 5) {
    const letters = plate.replace(/\d/g, '').slice(0, 3) || 'VIP';
    [`${letters}777`, `${letters}111`, `${letters}999`, `${letters}007`].forEach(add);
  }

  return related.slice(0, 8);
}

function buildFaqs(plate: string, analysis: PlateAnalysis, groups: MeaningGroups) {
  const topMeaning = analysis.topMeanings[0];
  return [
    {
      question: `Kodėl ${plate} gali būti įdomus?`,
      answer:
        analysis.collectorInsights[0] ??
        `${plate} gali būti įdomus dėl savo rašto, įsimenamumo arba asmeninės reikšmės konkrečiam pirkėjui.`,
    },
    {
      question: `${plate} turi paslėptą reikšmę?`,
      answer: topMeaning
        ? `Unikodas aptiko galimą reikšmę „${topMeaning.text}“. ${topMeaning.reason}`
        : 'Ryškios paslėptos reikšmės neaptikta, bet numeris vis tiek gali būti svarbus žmogui, kuriam jis turi asmeninę istoriją.',
    },
    {
      question: `${plate} turi automobilinę asociaciją?`,
      answer: groups.automotive.length > 0
        ? `Taip, aptikta automobilinė asociacija: ${groups.automotive.map((meaning) => meaning.text).join(', ')}. Tokios nuorodos gali būti įdomios entuziastams.`
        : 'Stiprios automobilinės asociacijos neaptikta. Tokiu atveju daugiau reikšmės turi raštas, vardas, žodis arba asmeninis ryšys.',
    },
    {
      question: `Ar ${plate} galima parduoti?`,
      answer:
        'Jeigu numerį galima teisėtai perleisti ar perregistruoti pagal galiojančią tvarką, galite sukurti skelbimą Unikodas platformoje. Unikodas nėra sandorio šalis ir negarantuoja kainos.',
    },
    {
      question: `Ar ${plate} vertė yra garantuota?`,
      answer:
        'Ne. Vertė priklauso nuo paklausos, pirkėjo, derybų, numerio reikšmės ir rinkos aktyvumo. Šis puslapis paaiškina galimas įžvalgas, bet nepateikia oficialaus vertinimo.',
    },
    {
      question: 'Ar pasikartojantys skaičiai yra kolekciniai?',
      answer:
        'Pasikartojantys skaičiai, tokie kaip 111, 777 ar 999, dažnai lengviau įsimenami ir gali patikti kolekcininkams. Vis dėlto jų patrauklumas priklauso nuo viso derinio.',
    },
  ];
}

function getScoreDescription(score: number): string {
  if (score >= 80) return 'Labai stiprus kolekcinis potencialas';
  if (score >= 60) return 'Ryškus kolekcinis patrauklumas';
  if (score >= 40) return 'Yra aiškių įdomių bruožų';
  return 'Labiau nišinis arba asmeninis derinys';
}

function getPatternFallback(plate: string): string {
  if (/(\d)\1{2,}/.test(plate)) return 'Derinyje yra trys pasikartojantys skaičiai, todėl jis lengviau įsimenamas.';
  if (/([A-Z])\1{2,}/.test(plate.replace(/\d/g, ''))) return 'Derinyje yra trys pasikartojančios raidės, todėl jis atrodo simetriškai.';
  return 'Ryškaus pasikartojančio rašto neaptikta. Tokiu atveju svarbesnės gali būti reikšmės arba asmeninės asociacijos.';
}

function ScoreBox({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase text-[var(--muted-soft)]">{label}</p>
        <p className="text-2xl font-black text-[var(--primary)]">{value}/100</p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--background)]">
        <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-3 text-sm font-bold leading-5 text-[var(--foreground)]">{text}</p>
    </div>
  );
}

function MeaningGroup({
  title,
  meanings,
  empty,
}: {
  title: string;
  meanings: PlateMeaning[];
  empty: string;
}) {
  return (
    <div className="rounded-3xl bg-[var(--muted)] p-4">
      <h3 className="text-sm font-black text-[var(--foreground)]">{title}</h3>
      {meanings.length > 0 ? (
        <div className="mt-3 space-y-2">
          {meanings.map((meaning) => (
            <div key={`${meaning.category}-${meaning.text}`} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-black text-[var(--foreground)]">{meaning.text}</p>
                <span className="rounded-full bg-[var(--primary)] px-2 py-1 text-xs font-black text-[var(--primary-foreground)]">
                  {meaning.confidence}%
                </span>
              </div>
              <p className="mt-1 text-xs font-bold uppercase text-[var(--muted-soft)]">
                {categoryLabels[meaning.category]}
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{meaning.reason}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{empty}</p>
      )}
    </div>
  );
}

function TextList({
  title,
  items,
  fallback,
  className = '',
}: {
  title: string;
  items: string[];
  fallback?: string;
  className?: string;
}) {
  const visibleItems = items.length > 0 ? items : fallback ? [fallback] : [];
  return (
    <div className={['rounded-3xl bg-[var(--muted)] p-4', className].filter(Boolean).join(' ')}>
      <h3 className="text-sm font-black text-[var(--foreground)]">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {visibleItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
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
