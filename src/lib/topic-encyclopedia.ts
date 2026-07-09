import type { ListingCardData } from '@/components/ListingCard';
import { analyzePlate, normalizePlate, type PlateAnalysis } from '@/lib/plate-intelligence';
import {
  KNOWLEDGE_BASE,
  normalizeKnowledgeText,
  searchKnowledgeIndex,
  type NormalizedKnowledgeEntry,
} from '@/lib/plate-intelligence/database';

export type TopicListing = ListingCardData;

export type TopicFaq = {
  question: string;
  answer: string;
};

export type TopicRelatedItem = {
  label: string;
  href: string;
  kind: 'topic' | 'plate';
};

export type EncyclopediaTopic = {
  slug: string;
  entry: NormalizedKnowledgeEntry;
  title: string;
  seoTitle: string;
  description: string;
  intro: string[];
  knowledgeGraph: TopicRelatedItem[];
  relatedTopics: TopicRelatedItem[];
  relatedAnalyses: TopicRelatedItem[];
  facts: string[];
  faqs: TopicFaq[];
  keywords: string[];
};

const AUTOMOTIVE_CATEGORIES = new Set([
  'cars',
  'motorcycles',
  'trucks',
  'engines',
  'gearboxes',
  'performance',
  'manufacturers',
  'supercars',
  'motorsport',
]);

const STATIC_TOPIC_LIMIT = 450;
const FEATURED_STATIC_TOPICS = new Set([
  'BMW',
  'AUDI',
  'MERCEDES',
  'AMG',
  'RS',
  'M',
  'GT3',
  '777',
  'VARDINIAI',
  'VYTIS',
  'MOTOCIKLAI',
]);

const entryByNormalizedKeyword = new Map(
  KNOWLEDGE_BASE.index.entries.map((entry) => [entry.normalizedKeyword, entry] as const),
);

export function getEncyclopediaTopic(rawSlug: string): EncyclopediaTopic | null {
  const entry = resolveTopicEntry(rawSlug);
  if (!entry) return null;

  const slug = slugFromEntry(entry);
  const relatedEntries = getRelatedEntries(entry);
  const relatedAnalyses = buildRelatedAnalyses(entry, relatedEntries);
  const relatedTopics = relatedEntries
    .filter((related) => related.normalizedKeyword !== entry.normalizedKeyword)
    .map((related) => ({
      label: related.displayName,
      href: `/tema/${slugFromEntry(related)}`,
      kind: 'topic' as const,
    }))
    .slice(0, 10);

  const title = buildTopicTitle(entry);
  const description = buildDescription(entry, title);
  const intro = buildIntro(entry, title);
  const faqs = buildFaqs(entry, title);

  return {
    slug,
    entry,
    title,
    seoTitle: `${title} | Unikodas enciklopedija`,
    description,
    intro,
    knowledgeGraph: buildKnowledgeGraph(entry, relatedEntries, relatedAnalyses),
    relatedTopics,
    relatedAnalyses,
    facts: buildFacts(entry, relatedEntries, relatedAnalyses),
    faqs,
    keywords: buildKeywords(entry, title),
  };
}

export function getStaticEncyclopediaParams(): Array<{ slug: string }> {
  return getStaticTopicEntries().map((entry) => ({ slug: slugFromEntry(entry) }));
}

export function getEncyclopediaSitemapPaths(): string[] {
  return getStaticTopicEntries().map((entry) => `/tema/${slugFromEntry(entry)}`);
}

export function rankTopicListings(topic: EncyclopediaTopic, listings: TopicListing[], limit = 6): TopicListing[] {
  const relatedEntryKeys = new Set([
    topic.entry.normalizedKeyword,
    topic.entry.normalizedDisplayName,
    ...topic.entry.normalizedAliases,
    ...topic.knowledgeGraph.map((item) => normalizeKnowledgeText(item.label)),
  ]);
  const topicTags = new Set(topic.entry.tags.map(normalizeKnowledgeText));
  const relatedPlates = new Set(topic.relatedAnalyses.map((item) => normalizePlate(item.label)));

  return listings
    .map((listing) => {
      const plate = normalizePlate(listing.plate_text);
      const analysis = analyzePlate(plate, {
        symbol: listing.flag_type,
        type: listing.plate_type,
      });
      const knowledgeMatches = searchKnowledgeIndex(KNOWLEDGE_BASE.index, plate);
      const directMatch = [...relatedEntryKeys].some((key) => key.length >= 2 && plate.includes(key));
      const relatedPlate = relatedPlates.has(plate);
      const meaningMatch = analysis.topMeanings.some((meaning) => relatedEntryKeys.has(normalizeKnowledgeText(meaning.text)));
      const knowledgeMatch = knowledgeMatches.some((match) => {
        const entry = match.entry;
        const sameEntry = relatedEntryKeys.has(entry.normalizedKeyword) || relatedEntryKeys.has(entry.normalizedDisplayName);
        const sameTag = entry.tags.some((tag) => topicTags.has(normalizeKnowledgeText(tag)));
        return match.confidence >= 72 && (sameEntry || sameTag);
      });

      const score =
        (directMatch ? 42 : 0) +
        (relatedPlate ? 36 : 0) +
        (meaningMatch ? 30 : 0) +
        (knowledgeMatch ? 28 : 0) +
        Math.min(18, analysis.score / 5);

      return { listing, score };
    })
    .filter((item) => item.score >= 26)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.listing);
}

function resolveTopicEntry(rawSlug: string): NormalizedKnowledgeEntry | null {
  const normalized = normalizeKnowledgeText(decodeURIComponent(rawSlug).replace(/-/g, ' '));
  if (!normalized) return null;

  const candidates = [
    ...(KNOWLEDGE_BASE.index.exact.get(normalized) ?? []),
    ...(KNOWLEDGE_BASE.index.alias.get(normalized) ?? []),
    ...searchKnowledgeIndex(KNOWLEDGE_BASE.index, normalized)
      .filter((match) => match.confidence >= 72)
      .map((match) => match.entry),
  ];

  return chooseBestEntry(normalized, candidates);
}

function chooseBestEntry(normalized: string, entries: readonly NormalizedKnowledgeEntry[]): NormalizedKnowledgeEntry | null {
  const unique = new Map(entries.map((entry) => [entry.id, entry] as const));
  const sorted = [...unique.values()].sort((a, b) => scoreEntryForTopic(b, normalized) - scoreEntryForTopic(a, normalized));
  return sorted[0] ?? null;
}

function scoreEntryForTopic(entry: NormalizedKnowledgeEntry, normalized: string): number {
  const exactBoost = entry.normalizedKeyword === normalized ? 80 : entry.normalizedDisplayName === normalized ? 68 : 0;
  const aliasBoost = entry.normalizedAliases.includes(normalized) ? 48 : 0;
  const categoryBoost = getCategoryPriority(entry.category);
  const featuredBoost = FEATURED_STATIC_TOPICS.has(entry.normalizedKeyword) ? 120 : 0;
  const subcategoryBoost = entry.subcategory.includes('brand') ? 14 : entry.subcategory.includes('performance') ? 10 : 0;
  return entry.confidence + exactBoost + aliasBoost + categoryBoost + featuredBoost + subcategoryBoost - Math.max(0, entry.normalizedKeyword.length - 18);
}

function getStaticTopicEntries(): NormalizedKnowledgeEntry[] {
  const bySlug = new Map<string, NormalizedKnowledgeEntry>();

  for (const entry of KNOWLEDGE_BASE.index.entries) {
    if (!isStaticTopicCandidate(entry)) continue;
    const slug = slugFromEntry(entry);
    const current = bySlug.get(slug);
    if (!current || scoreEntryForTopic(entry, entry.normalizedKeyword) > scoreEntryForTopic(current, current.normalizedKeyword)) {
      bySlug.set(slug, entry);
    }
  }

  return [...bySlug.values()]
    .sort((a, b) => scoreEntryForTopic(b, b.normalizedKeyword) - scoreEntryForTopic(a, a.normalizedKeyword))
    .slice(0, STATIC_TOPIC_LIMIT);
}

function isStaticTopicCandidate(entry: NormalizedKnowledgeEntry): boolean {
  if (!entry.normalizedKeyword || entry.normalizedKeyword.length > 18) return false;
  if (FEATURED_STATIC_TOPICS.has(entry.normalizedKeyword)) return true;
  if (entry.category === 'plate-concepts') return true;
  if (entry.category === 'manufacturers') return entry.confidence >= 78;
  if (['performance', 'supercars', 'engines', 'motorsport'].includes(entry.category)) return entry.confidence >= 84;
  if (entry.category === 'motorcycles') return entry.confidence >= 88 && entry.normalizedKeyword.length <= 12;
  if (entry.category === 'cars') return entry.confidence >= 90 && entry.normalizedKeyword.length <= 12;
  if (['luxury', 'business', 'common-words', 'cities'].includes(entry.category)) return entry.confidence >= 86 && entry.normalizedKeyword.length <= 12;
  return false;
}

function getRelatedEntries(entry: NormalizedKnowledgeEntry): NormalizedKnowledgeEntry[] {
  const candidates = new Map<string, NormalizedKnowledgeEntry>();
  const add = (candidate: NormalizedKnowledgeEntry | null | undefined) => {
    if (!candidate || candidate.id === entry.id) return;
    candidates.set(candidate.id, candidate);
  };

  for (const related of KNOWLEDGE_BASE.graph.get(entry.normalizedKeyword) ?? []) {
    add(entryByNormalizedKeyword.get(related));
  }

  for (const keyword of entry.relatedKeywords) {
    add(resolveTopicEntry(keyword));
  }

  const normalizedTags = new Set(entry.tags.map(normalizeKnowledgeText).filter(Boolean));
  for (const candidate of KNOWLEDGE_BASE.index.entries) {
    if (candidates.size >= 60) break;
    if (candidate.id === entry.id) continue;
    if (candidate.tags.some((tag) => normalizedTags.has(normalizeKnowledgeText(tag)))) {
      add(candidate);
    }
  }

  return [...candidates.values()]
    .sort((a, b) => scoreRelatedEntry(b, entry) - scoreRelatedEntry(a, entry))
    .slice(0, 18);
}

function scoreRelatedEntry(candidate: NormalizedKnowledgeEntry, topic: NormalizedKnowledgeEntry): number {
  const sameCategory = candidate.category === topic.category ? 14 : 0;
  const automotiveBoost = AUTOMOTIVE_CATEGORIES.has(candidate.category) ? 12 : 0;
  const tagOverlap = candidate.tags.filter((tag) => topic.tags.includes(tag)).length * 8;
  const relatedBoost = topic.relatedKeywords.map(normalizeKnowledgeText).includes(candidate.normalizedKeyword) ? 20 : 0;
  return candidate.confidence + sameCategory + automotiveBoost + tagOverlap + relatedBoost - Math.max(0, candidate.normalizedKeyword.length - 10);
}

function buildRelatedAnalyses(
  entry: NormalizedKnowledgeEntry,
  relatedEntries: readonly NormalizedKnowledgeEntry[],
): TopicRelatedItem[] {
  const values: string[] = [
    entry.keyword,
    ...entry.relatedKeywords,
    ...entry.aliases,
    ...relatedEntries.map((related) => related.keyword),
    ...relatedEntries.map((related) => related.displayName),
    ...analyzePlate(entry.keyword).similarPlateIdeas,
  ];

  const seen = new Set<string>();
  const related: TopicRelatedItem[] = [];

  for (const value of values) {
    const plate = normalizePlate(value).slice(0, 10);
    if (!plate || plate.length < 2 || seen.has(plate)) continue;
    const analysis = analyzePlate(plate);
    const hasMeaning = analysis.topMeanings.some((meaning) => meaning.confidence >= 72);
    if (analysis.score < 24 && !hasMeaning && !entryByNormalizedKeyword.has(normalizeKnowledgeText(plate))) continue;
    seen.add(plate);
    related.push({
      label: plate,
      href: `/numerio/${plate}`,
      kind: 'plate',
    });
    if (related.length >= 10) break;
  }

  return related;
}

function buildKnowledgeGraph(
  entry: NormalizedKnowledgeEntry,
  relatedEntries: readonly NormalizedKnowledgeEntry[],
  relatedAnalyses: readonly TopicRelatedItem[],
): TopicRelatedItem[] {
  const topicNode = {
    label: entry.displayName,
    href: `/tema/${slugFromEntry(entry)}`,
    kind: 'topic' as const,
  };
  const topicNodes = relatedEntries.slice(0, 5).map((related) => ({
    label: related.displayName,
    href: `/tema/${slugFromEntry(related)}`,
    kind: 'topic' as const,
  }));

  return [topicNode, ...topicNodes, ...relatedAnalyses.slice(0, 5)].slice(0, 11);
}

function buildTopicTitle(entry: NormalizedKnowledgeEntry): string {
  if (/numer/i.test(entry.displayName)) return entry.displayName;
  return `${entry.displayName} numeriai`;
}

function buildDescription(entry: NormalizedKnowledgeEntry, title: string): string {
  const base = entry.description.replace(/\s+/g, ' ').trim();
  const angle = AUTOMOTIVE_CATEGORIES.has(entry.category)
    ? 'automobilių entuziastų atpažįstamas motyvas'
    : entry.category === 'plate-concepts'
      ? 'lietuviškų numerių tema'
      : 'galima numerio reikšmė';

  return `${title} Unikodas enciklopedijoje: kas tai yra, kodėl tai gali būti ${angle} ir kaip tokie deriniai atsiranda Lietuvos numerių prekyvietėje. ${base}`;
}

function buildIntro(entry: NormalizedKnowledgeEntry, title: string): string[] {
  const subject = entry.displayName;
  const categoryText = getCategoryText(entry.category);
  return [
    `${title} apima derinius, kuriuose matomas ${subject} motyvas arba jam artimos užuominos. Lietuviškuose numeriuose tokia reikšmė gali atsirasti tiesiogiai, per trumpinį, modelio kodą, pasikartojančius skaičius ar vizualų raidžių ir skaičių žaismą.`,
    entry.collectorNotes ||
      `${subject} gali būti įdomus tada, kai derinys lengvai perskaitomas, įsimenamas ir turi aiškią auditoriją.`,
    `Unikodas šią temą sieja su ${categoryText}, aktyviais skelbimais, susijusiomis numerio analizėmis ir kitomis žinių bazės sąsajomis. Puslapis nevertina kainos, nes numerio vertė priklauso nuo paklausos ir konkretaus pirkėjo.`,
  ];
}

function buildFacts(
  entry: NormalizedKnowledgeEntry,
  relatedEntries: readonly NormalizedKnowledgeEntry[],
  relatedAnalyses: readonly TopicRelatedItem[],
): string[] {
  const facts = [
    entry.collectorNotes,
    `${entry.displayName} turi ${relatedEntries.length} susijusių įrašų Unikodas žinių bazėje, todėl temą galima nagrinėti per artimus modelius, trumpinius arba simbolius.`,
    relatedAnalyses.length > 0
      ? `Susijusios analizės, tokios kaip ${relatedAnalyses.slice(0, 3).map((item) => item.label).join(', ')}, padeda pamatyti, kaip tema atrodo realiuose numerių deriniuose.`
      : 'Tema gali būti naudinga net tada, kai konkretus numeris atrodo paprastas: svarbus yra kontekstas ir tai, kam derinys turi prasmę.',
  ].filter(Boolean);

  if (AUTOMOTIVE_CATEGORIES.has(entry.category)) {
    facts.push('Automobilių temos numeriuose dažnai veikia stipriausiai tada, kai raidės ir skaičiai palaiko vienas kitą, pavyzdžiui markė kartu su modelio kodu.');
  }

  if (entry.normalizedKeyword.length <= 4) {
    facts.push('Trumpi deriniai lengviau įsimena ir dažniau atrodo švariai ant numerio plokštelės.');
  }

  return facts.slice(0, 5);
}

function buildFaqs(entry: NormalizedKnowledgeEntry, title: string): TopicFaq[] {
  const subject = entry.displayName;
  return [
    {
      question: `Kas yra ${title}?`,
      answer: `${title} yra Unikodas enciklopedijos tema apie numerių derinius, kuriuose matomas ${subject} motyvas, trumpinys, simbolis arba susijusi reikšmė.`,
    },
    {
      question: `Kodėl ${subject} gali būti įdomu pirkėjams?`,
      answer: `${subject} gali būti patrauklu dėl atpažįstamos reikšmės, lengvo įsiminimo, automobilių ar asmeninės asociacijos ir aiškios auditorijos.`,
    },
    {
      question: `Ar ${subject} garantuoja didesnę numerio kainą?`,
      answer: 'Ne. Unikodas negarantuoja kainos ir nepateikia oficialaus vertinimo. Vertė priklauso nuo paklausos, pirkėjo, derybų ir bendro derinio stiprumo.',
    },
    {
      question: `Kaip rasti ${subject} numerį?`,
      answer: 'Galite peržiūrėti susijusius skelbimus šiame puslapyje, naudoti Unikodas numerio analizę arba naršyti bendrą prekyvietę pagal norimą raidžių ir skaičių derinį.',
    },
    {
      question: `Ar tokį numerį galima parduoti per Unikodas?`,
      answer: 'Taip, jei numerį galite teisėtai perleisti ar perregistruoti pagal galiojančią tvarką. Unikodas padeda paskelbti numerį ir susisiekti su pirkėjais per vidines žinutes.',
    },
  ];
}

function buildKeywords(entry: NormalizedKnowledgeEntry, title: string): string[] {
  return [
    title.toLowerCase(),
    `${entry.displayName} numeris`,
    `${entry.displayName} reikšmė`,
    'automobilių numeriai',
    'unikalūs numeriai',
    ...entry.aliases.slice(0, 4).map((alias) => `${alias} numeriai`),
  ];
}

function getCategoryText(category: string): string {
  if (category === 'manufacturers') return 'automobilių markėmis';
  if (category === 'performance') return 'performance ir sportinių modelių asociacijomis';
  if (category === 'supercars') return 'superautomobilių kultūra';
  if (category === 'cars') return 'automobilių modeliais';
  if (category === 'motorcycles') return 'motociklų markėmis ir modeliais';
  if (category === 'engines') return 'variklių kodais ir techninėmis asociacijomis';
  if (category === 'plate-concepts') return 'lietuviškų numerių temomis';
  if (category === 'cities') return 'vietovėmis ir miesto identitetu';
  return 'atpažįstamomis reikšmėmis';
}

function getCategoryPriority(category: string): number {
  if (category === 'plate-concepts') return 58;
  if (category === 'manufacturers') return 56;
  if (category === 'performance') return 52;
  if (category === 'supercars') return 50;
  if (category === 'cars') return 44;
  if (category === 'motorcycles') return 42;
  if (category === 'engines') return 40;
  if (category === 'luxury') return 34;
  if (category === 'business') return 30;
  if (category === 'common-words') return 28;
  if (category === 'cities') return 24;
  return 12;
}

function slugFromEntry(entry: NormalizedKnowledgeEntry): string {
  return entry.normalizedKeyword.toLowerCase();
}
