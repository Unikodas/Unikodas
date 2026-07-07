import { BUSINESS_TERMS } from '@/lib/plate-intelligence/business';
import { CAR_BRANDS } from '@/lib/plate-intelligence/brands';
import {
  AMG_NUMBERS,
  AUDI_CODES,
  BMW_MODEL_NUMBERS,
  BMW_SERIES_CODES,
  CAR_MODEL_TERMS,
  MERCEDES_MODEL_NUMBERS,
  PORSCHE_CODES,
  VOLKSWAGEN_CODES,
} from '@/lib/plate-intelligence/car-models';
import { CITIES } from '@/lib/plate-intelligence/cities';
import { COMMON_WORDS, LUXURY_WORDS } from '@/lib/plate-intelligence/common-words';
import { LEET_SUBSTITUTIONS, describeLeetSubstitution } from '@/lib/plate-intelligence/leet';
import { ENGLISH_NAMES } from '@/lib/plate-intelligence/names-en';
import { LITHUANIAN_NAMES } from '@/lib/plate-intelligence/names-lt';
import { PERFORMANCE_TERMS } from '@/lib/plate-intelligence/performance';

export type PlateAnalysisFactor = {
  name: string;
  scoreImpact: number;
  description: string;
};

export type PlateAnalysisContext = {
  symbol?: 'eu' | 'vytis' | 'flag' | 'none' | string | null;
  category?: string | null;
  type?: string | null;
};

export type PlateAnalysisDimensions = {
  memorability: number;
  patternStrength: number;
  hiddenMeaning: number;
  automotiveAppeal: number;
  collectorAppeal: number;
};

export type MeaningCategory =
  | 'PERSON_NAME'
  | 'CAR_MODEL'
  | 'CAR_BRAND'
  | 'CITY'
  | 'BUSINESS'
  | 'COMMON_WORD'
  | 'PERFORMANCE'
  | 'NUMBER_PATTERN'
  | 'LUXURY';

export type PlateMeaning = {
  text: string;
  category: MeaningCategory;
  confidence: number;
  reason: string;
};

export type PlateAnalysis = {
  score: number;
  label: string;
  badges: string[];
  dimensions: PlateAnalysisDimensions;
  topMeanings: PlateMeaning[];
  collectorInsights: string[];
  similarIdeas: string[];
  audienceInsights: string[];
  insights: string[];
  detectedMeanings: string[];
  factors: PlateAnalysisFactor[];
  symbolInsights: string[];
  similarPlateIdeas: string[];
};

type NormalizedAnalysisContext = {
  symbol: 'eu' | 'vytis' | 'flag' | null;
  type: 'car' | 'motorcycle' | 'personalized' | 'standard' | 'historical' | 'other' | null;
};

type DictionaryTerm = {
  text: string;
  normalized: string;
  aliases: string[];
  aliasNorms: string[];
  category: MeaningCategory;
  related: string[];
  priority: number;
};

type Variant = {
  text: string;
  substitutions: Array<{ digit: string; letter: string }>;
  source: 'original' | 'token' | 'leet' | 'collapsed-leet';
};

type InternalMeaning = PlateMeaning & {
  related: string[];
  normalizedText: string;
  source: string;
  priority: number;
};

const MAX_VARIANTS = 768;
const VARIANT_CACHE_LIMIT = 300;
const variantCache = new Map<string, Variant[]>();

const CATEGORY_LABELS: Record<MeaningCategory, string> = {
  PERSON_NAME: 'Vardas',
  CAR_MODEL: 'Automobilio modelis',
  CAR_BRAND: 'Automobilio markė',
  CITY: 'Miestas',
  BUSINESS: 'Verslo žodis',
  COMMON_WORD: 'Žodis',
  PERFORMANCE: 'Performance nuoroda',
  NUMBER_PATTERN: 'Skaičių raštas',
  LUXURY: 'Premium akcentas',
};

const DICTIONARY_TERMS = buildDictionaryTerms();

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function explainMeaning(meaning: PlateMeaning): string {
  return meaning.reason;
}

export function analyzePlate(plate: string, context?: PlateAnalysisContext): PlateAnalysis {
  const normalized = normalizePlate(plate);
  const normalizedContext = normalizeAnalysisContext(context);

  if (!normalized) {
    return {
      score: 0,
      label: getLabel(0),
      badges: [],
      dimensions: emptyDimensions(),
      topMeanings: [],
      collectorInsights: ['Numerio įžvalgoms reikia bent vienos raidės arba skaičiaus.'],
      similarIdeas: [],
      audienceInsights: ['Žmogui, kuriam šis derinys turi asmeninę reikšmę'],
      insights: ['Numerio įžvalgoms reikia bent vienos raidės arba skaičiaus.'],
      detectedMeanings: [],
      factors: [],
      symbolInsights: [],
      similarPlateIdeas: [],
    };
  }

  const alphaTokens = normalized.match(/[A-Z]+/g) ?? [];
  const numericTokens = normalized.match(/\d+/g) ?? [];
  const lettersOnly = alphaTokens.join('');
  const digitsOnly = numericTokens.join('');
  const topMeanings = inferTopMeanings({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
  });
  const symbolInsights = buildContextInsights(normalizedContext, normalized);
  const collectorInsights = buildCollectorInsights({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
    topMeanings,
    normalizedContext,
  });
  const audienceInsights = buildAudienceInsights(topMeanings, normalizedContext);
  const similarIdeas = buildSimilarIdeas({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
    topMeanings,
  });
  const dimensions = buildDimensions({
    normalized,
    topMeanings,
    collectorInsights,
    normalizedContext,
  });
  const score = calculateScore(dimensions, topMeanings);
  const badges = buildBadges(topMeanings, normalizedContext);
  const factors = buildFactors(topMeanings, collectorInsights);
  const insights = collectorInsights.length > 0
    ? collectorInsights
    : ['Derinys atrodo paprastas, bet gali turėti asmeninę reikšmę konkrečiam žmogui.'];
  const detectedMeanings = topMeanings.map(
    (meaning) => `${meaning.text} (${meaning.confidence}%) – ${explainMeaning(meaning)}`,
  );

  return {
    score,
    label: getLabel(score),
    badges,
    dimensions,
    topMeanings,
    collectorInsights,
    similarIdeas,
    audienceInsights,
    insights,
    detectedMeanings,
    factors,
    symbolInsights,
    similarPlateIdeas: similarIdeas,
  };
}

function buildDictionaryTerms(): DictionaryTerm[] {
  const terms: Array<Omit<DictionaryTerm, 'normalized' | 'aliasNorms'>> = [];

  for (const name of LITHUANIAN_NAMES) {
    terms.push({ text: name, aliases: [], category: 'PERSON_NAME', related: buildNameRelated(name), priority: 90 });
  }

  for (const name of ENGLISH_NAMES) {
    terms.push({ text: name, aliases: [], category: 'PERSON_NAME', related: buildNameRelated(name), priority: 72 });
  }

  for (const brand of CAR_BRANDS) {
    terms.push({
      text: brand.text,
      aliases: [...brand.aliases],
      category: 'CAR_BRAND',
      related: [...brand.related],
      priority: 84,
    });

    for (const alias of brand.aliases) {
      if (alias.length >= 3) {
        terms.push({
          text: alias,
          aliases: [],
          category: 'CAR_BRAND',
          related: [brand.text, ...brand.related],
          priority: 66,
        });
      }
    }
  }

  for (const model of CAR_MODEL_TERMS) {
    terms.push({
      text: model.text,
      aliases: [...model.aliases],
      category: 'CAR_MODEL',
      related: [...model.related],
      priority: 92,
    });
  }

  for (const modelNumber of BMW_MODEL_NUMBERS) {
    terms.push({
      text: modelNumber,
      aliases: [],
      category: 'CAR_MODEL',
      related: [`BMW${modelNumber}`, ...buildBmwRelated(modelNumber)],
      priority: 58,
    });
  }

  for (const city of CITIES) {
    terms.push({ text: city, aliases: [], category: 'CITY', related: [], priority: 54 });
  }

  for (const word of COMMON_WORDS) {
    if ((LUXURY_WORDS as readonly string[]).includes(word)) continue;
    terms.push({ text: word, aliases: [], category: 'COMMON_WORD', related: buildWordRelated(word), priority: 56 });
  }

  for (const word of LUXURY_WORDS) {
    terms.push({ text: word, aliases: [], category: 'LUXURY', related: buildWordRelated(word), priority: 68 });
  }

  for (const term of PERFORMANCE_TERMS) {
    terms.push({ text: term, aliases: term === 'TYPER' ? ['TYPE R'] : [], category: 'PERFORMANCE', related: buildPerformanceRelated(term), priority: 76 });
  }

  for (const term of BUSINESS_TERMS) {
    if (term === 'VIP') continue;
    terms.push({ text: term, aliases: [], category: 'BUSINESS', related: [], priority: 48 });
  }

  return terms.map((term) => ({
    ...term,
    normalized: normalizePlate(term.text),
    aliasNorms: term.aliases.map(normalizePlate).filter(Boolean),
  }));
}

function inferTopMeanings({
  normalized,
  alphaTokens,
  numericTokens,
  lettersOnly,
  digitsOnly,
}: {
  normalized: string;
  alphaTokens: string[];
  numericTokens: string[];
  lettersOnly: string;
  digitsOnly: string;
}): PlateMeaning[] {
  const meanings = new Map<string, InternalMeaning>();
  const variants = getReadableVariants(normalized);
  const tokenVariants = [
    variantFromText(normalized, 'original'),
    ...alphaTokens.map((token) => variantFromText(token, 'token')),
    ...numericTokens.map((token) => variantFromText(token, 'token')),
    ...(lettersOnly ? [variantFromText(lettersOnly, 'token')] : []),
    ...(digitsOnly ? [variantFromText(digitsOnly, 'token')] : []),
  ];

  const addMeaning = (meaning: InternalMeaning) => {
    const key = meaning.text;
    const existing = meanings.get(key);
    if (
      !existing ||
      meaning.confidence > existing.confidence ||
      (meaning.confidence === existing.confidence && meaning.priority > existing.priority)
    ) {
      meanings.set(key, {
        ...meaning,
        confidence: clampScore(meaning.confidence),
      });
    }
  };

  // Pass 1: exact match against the original plate and natural tokens.
  for (const candidate of tokenVariants) {
    for (const term of DICTIONARY_TERMS) {
      const exactKind = getExactMatchKind(term, candidate.text);
      if (!exactKind) continue;
      addMeaning(createMeaning(term, exactKind === 'exact' ? 99 : 90, 'exact', candidate));
    }
  }

  // Pass 2 and 4: every bounded realistic leetspeak combination is scored.
  for (const variant of variants) {
    if (variant.source === 'original' || variant.substitutions.length === 0) continue;
    for (const term of DICTIONARY_TERMS) {
      const exactKind = getExactMatchKind(term, variant.text);
      if (exactKind) {
        addMeaning(createMeaning(term, exactKind === 'exact' ? 97 : 88, 'leet', variant));
      }
    }
  }

  // Pass 3: substring search on original text and generated variants.
  for (const candidate of [...tokenVariants, ...variants]) {
    for (const term of DICTIONARY_TERMS) {
      if (term.normalized.length < 3) continue;
      if (candidate.text.includes(term.normalized) && candidate.text !== term.normalized) {
        addMeaning(createMeaning(term, candidate.substitutions.length > 0 ? 82 : 86, 'substring', candidate));
      }
      for (const alias of term.aliasNorms) {
        if (alias.length >= 3 && candidate.text.includes(alias) && candidate.text !== alias) {
          addMeaning(createMeaning(term, candidate.substitutions.length > 0 ? 80 : 84, 'substring', candidate, alias));
        }
      }
    }
  }

  // Pass 5: fuzzy matching. Kept intentionally narrow to avoid noisy claims.
  for (const candidate of [...tokenVariants, ...variants]) {
    if (candidate.text.length < 3 || candidate.text.length > 9) continue;
    for (const term of DICTIONARY_TERMS) {
      if (!isFuzzyEligible(term, candidate)) continue;
      const confidence = getFuzzyConfidence(candidate.text, term.normalized);
      if (confidence > 0) {
        addMeaning(createMeaning(term, confidence, 'fuzzy', candidate));
      }
      for (const alias of term.aliasNorms) {
        const aliasConfidence = getFuzzyConfidence(candidate.text, alias);
        if (aliasConfidence > 0) {
          addMeaning(createMeaning(term, Math.max(76, aliasConfidence - 4), 'fuzzy', candidate, alias));
        }
      }
    }
  }

  // Pass 6: prefix expansion, only for known dictionary entries.
  for (const candidate of [...tokenVariants, ...variants]) {
    if (!/^[A-Z]+$/.test(candidate.text) || candidate.text.length < 3) continue;
    for (const term of DICTIONARY_TERMS) {
      if (!isPrefixEligible(term)) continue;
      if (term.normalized.startsWith(candidate.text) && term.normalized !== candidate.text) {
        const missing = term.normalized.length - candidate.text.length;
        if (missing > 0 && missing <= 3) {
          const romanBoost = /1{2,}/.test(digitsOnly) && term.normalized.endsWith('I') ? 4 : 0;
          addMeaning(createMeaning(term, 89 + romanBoost - Math.max(0, missing - 1) * 3, 'prefix', candidate));
        }
      }
    }
  }

  for (const pattern of detectNumberPatternMeanings({ normalized, lettersOnly, digitsOnly, numericTokens })) {
    addMeaning(pattern);
  }

  return Array.from(meanings.values())
    .sort((a, b) => b.confidence - a.confidence || b.priority - a.priority || b.text.length - a.text.length)
    .slice(0, 5)
    .map(({ text, category, confidence, reason }) => ({ text, category, confidence, reason }));
}

function createMeaning(
  term: DictionaryTerm,
  confidence: number,
  pass: 'exact' | 'leet' | 'substring' | 'fuzzy' | 'prefix',
  candidate: Variant,
  matchedAlias?: string,
): InternalMeaning {
  const matchedText = matchedAlias ?? candidate.text;
  return {
    text: term.text,
    category: term.category,
    confidence: adjustConfidence(term, confidence, candidate),
    reason: buildMeaningReason(term, pass, candidate, matchedText),
    related: term.related,
    normalizedText: term.normalized,
    source: pass,
    priority: term.priority,
  };
}

function buildMeaningReason(
  term: DictionaryTerm,
  pass: 'exact' | 'leet' | 'substring' | 'fuzzy' | 'prefix',
  candidate: Variant,
  matchedText: string,
): string {
  const substitutions = describeSubstitutions(candidate.substitutions);
  if (pass === 'exact') {
    if (candidate.source === 'token' && candidate.text !== term.normalized) {
      return `Aptiktas aiškus fragmentas „${candidate.text}“, siejamas su „${term.text}“.`;
    }
    return `Derinys tiesiogiai atitinka žinomą reikšmę „${term.text}“.`;
  }

  if (pass === 'leet') {
    return `Paslėptas skaitymas „${term.text}“ naudojant ${substitutions || 'vizualius skaičių ir raidžių pakeitimus'}.`;
  }

  if (pass === 'substring') {
    return `Derinyje matomas fragmentas „${matchedText}“, kuris gali priminti „${term.text}“.`;
  }

  if (pass === 'fuzzy') {
    return `Derinys yra labai artimas „${term.text}“; ${substitutions || 'skiriasi tik vienas simbolis arba pasikartojanti raidė'}.`;
  }

  return `„${candidate.text}“ yra žinomos reikšmės „${term.text}“ pradžia, todėl gali būti taip perskaitoma.`;
}

function adjustConfidence(term: DictionaryTerm, confidence: number, candidate: Variant): number {
  let adjusted = confidence;
  if (term.category === 'PERSON_NAME' && candidate.substitutions.length > 0) adjusted += 2;
  if (term.category === 'CAR_MODEL') adjusted += 2;
  if (term.category === 'CAR_BRAND' && term.priority < 70) adjusted -= 17;
  if (term.normalized.length <= 3 && candidate.text.length > term.normalized.length + 2) adjusted -= 8;
  return clampScore(adjusted);
}

function getExactMatchKind(term: DictionaryTerm, candidate: string): 'exact' | 'alias' | null {
  if (candidate === term.normalized) return 'exact';
  if (term.aliasNorms.includes(candidate)) return 'alias';
  return null;
}

function isFuzzyEligible(term: DictionaryTerm, candidate: Variant): boolean {
  if (term.category === 'CAR_MODEL') return false;
  if (term.normalized.length < 4 || term.normalized.length > 9) return false;
  if (Math.abs(candidate.text.length - term.normalized.length) > 1) return false;
  if (!/^[A-Z0-9]+$/.test(candidate.text)) return false;
  if (candidate.substitutions.length === 0 && candidate.source === 'original' && /\d/.test(candidate.text)) return false;
  return true;
}

function getFuzzyConfidence(candidate: string, target: string): number {
  if (candidate === target) return 0;
  if (candidate.length === target.length + 1 && removeOneRepeatedCharacter(candidate).includes(target)) {
    return 94;
  }
  if (Math.abs(candidate.length - target.length) <= 1 && editDistanceAtMostOne(candidate, target)) {
    return target.length <= 5 ? 84 : 80;
  }
  return 0;
}

function isPrefixEligible(term: DictionaryTerm): boolean {
  return ['PERSON_NAME', 'CAR_BRAND', 'CITY', 'COMMON_WORD', 'BUSINESS', 'LUXURY', 'PERFORMANCE'].includes(term.category);
}

function detectNumberPatternMeanings({
  normalized,
  lettersOnly,
  digitsOnly,
  numericTokens,
}: {
  normalized: string;
  lettersOnly: string;
  digitsOnly: string;
  numericTokens: string[];
}): InternalMeaning[] {
  const meanings: InternalMeaning[] = [];
  const repeatedLetters = lettersOnly.match(/([A-Z])\1{2,}/)?.[0];
  const repeatedNumbers = digitsOnly.match(/(\d)\1{2,}/)?.[0];
  const sequence = findSequentialRun(digitsOnly);
  const palindrome = findPalindrome([normalized, lettersOnly, digitsOnly, ...numericTokens]);

  if (repeatedLetters) {
    meanings.push(patternMeaning(
      'Pasikartojančios raidės',
      96,
      `Raidžių seka ${repeatedLetters} yra lengvai pastebima ir įsimenama.`,
      ['AAA777', 'BBB111', 'ABA111'],
    ));
  }

  if (repeatedNumbers) {
    meanings.push(patternMeaning(
      repeatedNumbers,
      repeatedNumbers === '777' ? 98 : 95,
      `Skaičių seka ${repeatedNumbers} turi tris vienodus skaičius.`,
      ['111', '777', '888', '999'],
    ));
  }

  if (sequence) {
    meanings.push(patternMeaning(
      sequence,
      82,
      `Skaičiai ${sequence} sudaro aiškią seką.`,
      ['123', '234', '456', '789'],
    ));
  }

  if (palindrome) {
    meanings.push(patternMeaning(
      'Simetriškas raštas',
      86,
      `Dalis ${palindrome} skaitoma panašiai iš abiejų pusių.`,
      ['ABA111', '1221', '7777'],
    ));
  }

  return meanings;
}

function patternMeaning(text: string, confidence: number, reason: string, related: string[]): InternalMeaning {
  return {
    text,
    category: 'NUMBER_PATTERN',
    confidence,
    reason,
    related,
    normalizedText: normalizePlate(text),
    source: 'pattern',
    priority: 64,
  };
}

function getReadableVariants(normalized: string): Variant[] {
  const cached = variantCache.get(normalized);
  if (cached) return cached;

  let variants: Variant[] = [{ text: '', substitutions: [], source: 'leet' }];

  for (const char of normalized) {
    const options = [
      { text: char, substitution: null },
      ...(LEET_SUBSTITUTIONS[char] ?? []).map((letter) => ({
        text: letter,
        substitution: { digit: char, letter },
      })),
    ];

    const next: Variant[] = [];
    for (const variant of variants) {
      for (const option of options) {
        next.push({
          text: `${variant.text}${option.text}`,
          substitutions: option.substitution
            ? [...variant.substitutions, option.substitution]
            : variant.substitutions,
          source: option.substitution ? 'leet' : variant.source,
        });
      }
    }
    variants = dedupeVariants(next).slice(0, MAX_VARIANTS);
  }

  variants = dedupeVariants([
    variantFromText(normalized, 'original'),
    ...variants,
    ...generateCollapsedDigitRunVariants(normalized),
  ]).slice(0, MAX_VARIANTS);

  if (variantCache.size > VARIANT_CACHE_LIMIT) {
    const firstKey = variantCache.keys().next().value;
    if (firstKey) variantCache.delete(firstKey);
  }
  variantCache.set(normalized, variants);
  return variants;
}

function generateCollapsedDigitRunVariants(normalized: string): Variant[] {
  const variants: Variant[] = [];
  const digitRuns = Array.from(normalized.matchAll(/(\d)\1+/g));

  for (const run of digitRuns) {
    const digit = run[1];
    const start = run.index ?? 0;
    const end = start + run[0].length;
    const letters = LEET_SUBSTITUTIONS[digit] ?? [];

    for (const letter of letters) {
      variants.push({
        text: `${normalized.slice(0, start)}${letter}${normalized.slice(end)}`,
        substitutions: [{ digit, letter }],
        source: 'collapsed-leet',
      });

      variants.push({
        text: `${normalized.slice(0, start)}${letter.repeat(Math.min(3, run[0].length))}${normalized.slice(end)}`,
        substitutions: Array.from({ length: Math.min(3, run[0].length) }, () => ({ digit, letter })),
        source: 'collapsed-leet',
      });
    }
  }

  return variants;
}

function variantFromText(text: string, source: Variant['source']): Variant {
  return {
    text,
    substitutions: [],
    source,
  };
}

function dedupeVariants(variants: Variant[]): Variant[] {
  const byText = new Map<string, Variant>();
  for (const variant of variants) {
    if (!variant.text) continue;
    const existing = byText.get(variant.text);
    if (!existing || variant.substitutions.length < existing.substitutions.length) {
      byText.set(variant.text, variant);
    }
  }
  return Array.from(byText.values());
}

function normalizeAnalysisContext(context?: PlateAnalysisContext): NormalizedAnalysisContext {
  const symbol = normalizeSymbol(context?.symbol);
  const type = normalizeType(context?.type ?? context?.category);
  return { symbol, type };
}

function normalizeSymbol(symbol: PlateAnalysisContext['symbol']): NormalizedAnalysisContext['symbol'] {
  if (!symbol) return null;
  const value = String(symbol).trim().toLowerCase();
  if (['eu', 'es', 'eu_symbol', 'euro', 'european'].includes(value)) return 'eu';
  if (value === 'vytis') return 'vytis';
  if (['flag', 'lithuanian_flag', 'lietuva', 'lt_flag', 'lietuvos_veliava', 'lietuvos vėliava'].includes(value)) {
    return 'flag';
  }
  return null;
}

function normalizeType(type: string | null | undefined): NormalizedAnalysisContext['type'] {
  if (!type) return null;
  const value = String(type).trim().toLowerCase();
  if (['motorcycle', 'moto', 'motociklo', 'motociklu', 'motociklų'].includes(value)) return 'motorcycle';
  if (['personalized', 'vardinis', 'vardiniai', 'vanity'].includes(value)) return 'personalized';
  if (['standard', 'standartinis'].includes(value)) return 'standard';
  if (['car', 'auto', 'automobilio', 'automobiliu', 'automobilių'].includes(value)) return 'car';
  if (['historical', 'istorinis', 'istoriniai'].includes(value)) return 'historical';
  if (value === 'other' || value === 'kita' || value === 'kiti') return 'other';
  return null;
}

function buildContextInsights(context: NormalizedAnalysisContext, normalized: string): string[] {
  const insights: string[] = [];
  if (context.symbol === 'eu') {
    insights.push('ES simbolis – šiuo metu įprastas ir plačiai atpažįstamas numerio formatas.');
  }
  if (context.symbol === 'vytis') {
    insights.push('Vytis gali suteikti numeriui išskirtinumo ir patriotiškumo.');
  }
  if (context.symbol === 'flag') {
    insights.push('Lietuvos vėliavos simbolis gali patikti ieškantiems ryškesnio lietuviško akcento.');
  }
  if (context.type === 'motorcycle') {
    insights.push('Motociklų numeriai turi kitokį formatą, todėl trumpi ar lengvai įsimenami deriniai gali atrodyti dar išskirtiniau.');
    if (normalized.length <= 5) insights.push('Trumpas motociklo numerio derinys gali atrodyti kompaktiškai ir ryškiai.');
  }
  if (context.type === 'personalized') {
    insights.push('Vardinis tipas pabrėžia asmeninę numerio reikšmę ir lengvesnį įsimenamumą.');
  }
  if (context.type === 'standard') {
    insights.push('Standartinis formatas vertinamas pagal patį raidžių ir skaičių derinį, jo ritmą ir įsimenamumą.');
  }
  return insights;
}

function buildCollectorInsights({
  normalized,
  lettersOnly,
  digitsOnly,
  topMeanings,
  normalizedContext,
}: {
  normalized: string;
  alphaTokens: string[];
  numericTokens: string[];
  lettersOnly: string;
  digitsOnly: string;
  topMeanings: PlateMeaning[];
  normalizedContext: NormalizedAnalysisContext;
}): string[] {
  const insights: string[] = [];
  const addInsight = (value: string) => {
    if (!insights.includes(value)) insights.push(value);
  };

  for (const meaning of topMeanings) {
    if (meaning.category === 'CAR_MODEL') {
      if (/BMW/.test(meaning.text)) addInsight('Turi žinomo BMW modelio nuorodą.');
      else if (/Audi RS/.test(meaning.text)) addInsight('Turi sportišką Audi RS modelio nuorodą.');
      else if (/Porsche/.test(meaning.text)) addInsight('Turi atpažįstamą Porsche sportinio modelio nuorodą.');
      else if (/AMG|Mercedes/.test(meaning.text)) addInsight('Turi premium Mercedes-AMG asociaciją.');
      else addInsight('Turi atpažįstamą automobilio modelio nuorodą.');
    }
    if (meaning.category === 'CAR_BRAND') addInsight('Turi lengvai atpažįstamą automobilio markės fragmentą.');
    if (meaning.category === 'PERSON_NAME') addInsight('Turi pilną vardą arba labai aiškią jo vizualią formą.');
    if (meaning.category === 'PERFORMANCE') addInsight('Turi automobilių entuziastams pažįstamą performance trumpinį.');
    if (meaning.category === 'LUXURY') addInsight('Turi premium ar statuso asociaciją.');
    if (meaning.category === 'BUSINESS') addInsight('Gali tikti verslo ar profesinei tapatybei.');
    if (meaning.category === 'CITY') addInsight('Gali turėti vietos ar miesto tapatybės prasmę.');
  }

  if (/([A-Z])\1{2,}/.test(lettersOnly)) addInsight('Turi tris pasikartojančias raides, todėl atrodo simetriškai.');
  if (/(\d)\1{2,}/.test(digitsOnly)) addInsight('Turi tris vienodus skaičius, todėl lengviau įsimenamas.');
  if (findPalindrome([normalized, lettersOnly, digitsOnly])) addInsight('Turi simetrišką raštą.');
  if (isEasyToPronounce(lettersOnly)) addInsight('Raidžių dalis yra pakankamai lengvai ištariama.');
  if (normalized.length <= 6 || new Set(normalized).size <= 4) addInsight('Derinys yra lengvai prisimenamas dėl trumpumo arba aiškaus ritmo.');
  if (normalizedContext.symbol === 'vytis' || normalizedContext.symbol === 'flag') {
    addInsight('Simbolis suteikia papildomą vizualinį išskirtinumą.');
  }

  if (insights.length === 0) {
    addInsight('Derinys gali būti įdomus žmogui, kuriam jis turi asmeninę reikšmę.');
  }

  return insights.slice(0, 6);
}

function buildAudienceInsights(topMeanings: PlateMeaning[], context: NormalizedAnalysisContext): string[] {
  const audience: string[] = [];
  const addAudience = (value: string) => {
    if (!audience.includes(value)) audience.push(value);
  };

  for (const meaning of topMeanings) {
    if (meaning.category === 'CAR_MODEL' || meaning.category === 'CAR_BRAND' || meaning.category === 'PERFORMANCE') {
      if (/BMW/.test(meaning.text)) {
        addAudience('BMW entuziastams');
        const series = meaning.text.match(/\b([1-8])\d{2}\b/)?.[1];
        if (series) addAudience(`BMW ${series} serijos savininkams`);
      }
      if (/Audi|RS\d/.test(meaning.text)) addAudience('Audi entuziastams');
      if (/RS|AMG|GT|Porsche|FAST|TURBO|GTR|STI|EVO/.test(meaning.text)) addAudience('Sportinių automobilių mėgėjams');
      addAudience('Automobilių kolekcininkams');
    }
    if (meaning.category === 'PERSON_NAME') {
      addAudience(`Žmogui vardu ${formatDisplayWord(meaning.text)}`);
      addAudience('Ieškantiems vardinio numerio');
      addAudience('Norintiems lengvai įsimenamo derinio');
    }
    if (meaning.category === 'LUXURY' || meaning.category === 'BUSINESS') {
      addAudience('Ieškantiems statuso ar verslo įvaizdžio akcento');
    }
    if (meaning.category === 'NUMBER_PATTERN') {
      addAudience('Kolekcininkams, mėgstantiems simetriškus derinius');
      addAudience('Ieškantiems labai lengvai įsimenamo numerio');
    }
  }

  if (context.type === 'motorcycle') addAudience('Motociklų entuziastams');
  if (context.type === 'personalized') addAudience('Ieškantiems vardinio numerio');

  if (audience.length === 0) {
    addAudience('Žmogui, kuriam šis derinys turi asmeninę reikšmę');
    addAudience('Ieškantiems paprasto ir aiškaus numerio');
  }

  return audience.slice(0, 5);
}

function buildSimilarIdeas({
  normalized,
  alphaTokens,
  digitsOnly,
  topMeanings,
}: {
  normalized: string;
  alphaTokens: string[];
  numericTokens: string[];
  lettersOnly: string;
  digitsOnly: string;
  topMeanings: PlateMeaning[];
}): string[] {
  const ideas: string[] = [];
  const addIdea = (idea: string) => {
    const clean = normalizePlate(idea).slice(0, 8);
    if (clean && clean !== normalized && !ideas.includes(clean)) ideas.push(clean);
  };

  for (const meaning of topMeanings) {
    const term = DICTIONARY_TERMS.find((candidate) => candidate.text === meaning.text);
    term?.related.forEach(addIdea);

    if (meaning.category === 'PERSON_NAME') {
      const prefix = alphaTokens[0]?.slice(0, 3) || meaning.text.slice(0, 3);
      [`${prefix}444`, `${prefix}777`, `${prefix}111`, toLeetVariant(meaning.text), meaning.text].forEach(addIdea);
    }

    if (meaning.text === 'VIP') ['VIP111', 'VIP777', 'VIP999', 'LUX777'].forEach(addIdea);
    if (meaning.text === 'FAST') ['FAST1', 'FAST7', 'FAST8', 'RACE8'].forEach(addIdea);
  }

  if (/([A-Z])\1{2,}/.test(alphaTokens.join('')) || /(\d)\1{2,}/.test(digitsOnly)) {
    const repeatedLetters = alphaTokens.join('').match(/([A-Z])\1{2,}/)?.[0] ?? 'AAA';
    const repeatedNumbers = digitsOnly.match(/(\d)\1{2,}/)?.[0] ?? '111';
    [`${repeatedLetters}777`, `BBB${repeatedNumbers}`, `${repeatedLetters}999`, `ABA${repeatedNumbers}`].forEach(addIdea);
  }

  if (ideas.length < 3) {
    const base = alphaTokens[0]?.slice(0, 3) || 'UNI';
    [`${base}777`, `${base}111`, `${base}999`, `${base}007`].forEach(addIdea);
  }

  return ideas.slice(0, 8);
}

function buildDimensions({
  normalized,
  topMeanings,
  collectorInsights,
  normalizedContext,
}: {
  normalized: string;
  topMeanings: PlateMeaning[];
  collectorInsights: string[];
  normalizedContext: NormalizedAnalysisContext;
}): PlateAnalysisDimensions {
  const maxFor = (categories: MeaningCategory[]) =>
    topMeanings
      .filter((meaning) => categories.includes(meaning.category))
      .reduce((max, meaning) => Math.max(max, meaning.confidence), 0);

  const numberPattern = maxFor(['NUMBER_PATTERN']);
  const hiddenMeaning = maxFor(['PERSON_NAME', 'CITY', 'BUSINESS', 'COMMON_WORD', 'LUXURY']);
  const automotiveAppeal = maxFor(['CAR_MODEL', 'CAR_BRAND', 'PERFORMANCE']);
  const maxMeaning = topMeanings[0]?.confidence ?? 0;
  const compactBoost = normalized.length <= 5 ? 18 : normalized.length <= 6 ? 10 : 4;
  const contextBoost = normalizedContext.symbol === 'vytis' || normalizedContext.symbol === 'flag' ? 8 : 0;

  return {
    memorability: clampScore(maxMeaning * 0.42 + compactBoost + (numberPattern > 0 ? 18 : 0)),
    patternStrength: clampScore(numberPattern),
    hiddenMeaning: clampScore(hiddenMeaning),
    automotiveAppeal: clampScore(automotiveAppeal),
    collectorAppeal: clampScore(
      Math.max(numberPattern, automotiveAppeal, hiddenMeaning * 0.75) +
        collectorInsights.length * 3 +
        contextBoost,
    ),
  };
}

function calculateScore(dimensions: PlateAnalysisDimensions, topMeanings: PlateMeaning[]): number {
  const maxMeaning = topMeanings[0]?.confidence ?? 0;
  return clampScore(
    maxMeaning * 0.28 +
      dimensions.memorability * 0.22 +
      dimensions.patternStrength * 0.18 +
      dimensions.hiddenMeaning * 0.14 +
      dimensions.automotiveAppeal * 0.14 +
      dimensions.collectorAppeal * 0.04,
  );
}

function buildBadges(topMeanings: PlateMeaning[], context: NormalizedAnalysisContext): string[] {
  const badges: string[] = [];
  const addBadge = (badge: string) => {
    if (!badges.includes(badge)) badges.push(badge);
  };

  for (const meaning of topMeanings) {
    if (meaning.category === 'PERSON_NAME') addBadge('Vardinis derinys');
    if (meaning.category === 'CAR_MODEL' || meaning.category === 'CAR_BRAND') addBadge('Automobilių nuoroda');
    if (meaning.category === 'PERFORMANCE') addBadge('Performance');
    if (meaning.category === 'NUMBER_PATTERN') addBadge('Stiprus raštas');
    if (meaning.category === 'LUXURY') addBadge('Premium akcentas');
    if (meaning.category === 'BUSINESS') addBadge('Verslo akcentas');
    if (meaning.category === 'COMMON_WORD') addBadge('Žodinis derinys');
  }

  if (topMeanings.some((meaning) => ['CAR_MODEL', 'CAR_BRAND', 'PERFORMANCE'].includes(meaning.category))) {
    addBadge('Automobilių entuziastams');
  }
  if (topMeanings[0]?.confidence && topMeanings[0].confidence >= 90) addBadge('Aiški reikšmė');
  if (context.symbol === 'eu') addBadge('ES formatas');
  if (context.symbol === 'vytis') addBadge('Su Vyčiu');
  if (context.symbol === 'flag') addBadge('Su vėliava');
  if (context.type === 'motorcycle') addBadge('Motociklų numeris');
  if (context.type === 'personalized') addBadge('Vardinis derinys');

  return badges.slice(0, 10);
}

function buildFactors(topMeanings: PlateMeaning[], collectorInsights: string[]): PlateAnalysisFactor[] {
  const factors = topMeanings.slice(0, 5).map((meaning) => ({
    name: CATEGORY_LABELS[meaning.category],
    scoreImpact: Math.max(4, Math.round(meaning.confidence / 6)),
    description: explainMeaning(meaning),
  }));

  for (const insight of collectorInsights.slice(0, 2)) {
    if (factors.some((factor) => factor.description === insight)) continue;
    factors.push({
      name: 'Kolekcinė logika',
      scoreImpact: 6,
      description: insight,
    });
  }

  return factors.slice(0, 6);
}

function emptyDimensions(): PlateAnalysisDimensions {
  return {
    memorability: 0,
    patternStrength: 0,
    hiddenMeaning: 0,
    automotiveAppeal: 0,
    collectorAppeal: 0,
  };
}

function getLabel(score: number): string {
  if (score >= 80) return 'Kolekcinis derinys';
  if (score >= 60) return 'Labai stiprus derinys';
  if (score >= 40) return 'Patrauklus derinys';
  if (score >= 20) return 'Įdomus derinys';
  return 'Įprastas numeris';
}

function findSequentialRun(digits: string): string | null {
  for (let i = 0; i <= digits.length - 3; i += 1) {
    const a = Number(digits[i]);
    const b = Number(digits[i + 1]);
    const c = Number(digits[i + 2]);
    if (b === a + 1 && c === b + 1) return digits.slice(i, i + 3);
  }
  return null;
}

function findPalindrome(values: string[]): string | null {
  return (
    values
      .filter((value) => value.length >= 3 && value === value.split('').reverse().join(''))
      .sort((a, b) => b.length - a.length)[0] ?? null
  );
}

function removeOneRepeatedCharacter(value: string): string[] {
  const variants: string[] = [];
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === value[i - 1] || value[i] === value[i + 1]) {
      variants.push(`${value.slice(0, i)}${value.slice(i + 1)}`);
    }
  }
  return variants;
}

function editDistanceAtMostOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    let edits = 0;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) edits += 1;
      if (edits > 1) return false;
    }
    return edits === 1;
  }

  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      j += 1;
      if (edits > 1) return false;
    }
  }
  return true;
}

function describeSubstitutions(substitutions: Array<{ digit: string; letter: string }>): string | null {
  const unique = Array.from(
    new Map(substitutions.map((substitution) => [`${substitution.digit}:${substitution.letter}`, substitution])).values(),
  );
  if (unique.length === 0) return null;
  return unique
    .map((substitution) => `${substitution.digit}→${substitution.letter}`)
    .join(', ');
}

function isEasyToPronounce(letters: string): boolean {
  if (letters.length < 3 || letters.length > 6) return false;
  const vowels = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
  const chars = letters.split('');
  return chars.some((char) => vowels.has(char)) && chars.some((char) => !vowels.has(char));
}

function buildNameRelated(name: string): string[] {
  const prefix = name.slice(0, 3);
  return [`${prefix}111`, `${prefix}444`, `${prefix}777`, toLeetVariant(name), name];
}

function buildWordRelated(word: string): string[] {
  return [`${word}1`, `${word}7`, `${word}77`, `${word}777`];
}

function buildPerformanceRelated(term: string): string[] {
  if (term === 'AMG') return ['AMG043', 'AMG053', 'AMG063'];
  if (term === 'FAST') return ['FAST1', 'FAST7', 'FAST8'];
  return [`${term}1`, `${term}7`, `${term}777`];
}

function buildBmwRelated(model: string): string[] {
  const series = model[0];
  const seriesModels = BMW_MODEL_NUMBERS.filter((candidate) => candidate.startsWith(series));
  const index = seriesModels.indexOf(model as (typeof BMW_MODEL_NUMBERS)[number]);
  const nearby =
    index >= 0
      ? [...seriesModels.slice(index + 1), ...seriesModels.slice(Math.max(0, index - 2), index)]
      : seriesModels;
  return nearby.slice(0, 4).map((candidate) => `BMW${candidate}`);
}

function toLeetVariant(value: string): string {
  return value
    .replace(/O/g, '0')
    .replace(/A/g, '4')
    .replace(/S/g, '5')
    .replace(/I/g, '1')
    .replace(/T/g, '7');
}

function formatDisplayWord(value: string): string {
  return `${value.slice(0, 1)}${value.slice(1).toLowerCase()}`;
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

// Keep these dictionary exports referenced near the engine so future additions
// remain visible to TypeScript when only some model groups are used directly.
void AMG_NUMBERS;
void AUDI_CODES;
void BMW_SERIES_CODES;
void MERCEDES_MODEL_NUMBERS;
void PORSCHE_CODES;
void VOLKSWAGEN_CODES;
void describeLeetSubstitution;
