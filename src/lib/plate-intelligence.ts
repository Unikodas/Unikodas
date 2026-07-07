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

export type PlateAnalysis = {
  score: number;
  label: string;
  badges: string[];
  insights: string[];
  detectedMeanings: string[];
  factors: PlateAnalysisFactor[];
  symbolInsights: string[];
  audienceInsights: string[];
  similarPlateIdeas: string[];
  dimensions: PlateAnalysisDimensions;
};

const BMW_MODEL_NUMBERS = [
  '116',
  '118',
  '120',
  '125',
  '128',
  '130',
  '135',
  '140',
  '316',
  '318',
  '320',
  '325',
  '328',
  '330',
  '335',
  '340',
  '420',
  '425',
  '428',
  '430',
  '435',
  '440',
  '520',
  '525',
  '528',
  '530',
  '535',
  '540',
  '545',
  '550',
  '630',
  '635',
  '640',
  '645',
  '650',
  '730',
  '735',
  '740',
  '745',
  '750',
  '760',
] as const;

const BMW_SERIES_CODES = ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'X3', 'X5', 'X6', 'X7', 'I3', 'I4', 'I5', 'I7', 'I8'] as const;

const MERCEDES_MODEL_NUMBERS = [
  '180',
  '200',
  '220',
  '230',
  '250',
  '280',
  '300',
  '320',
  '350',
  '400',
  '430',
  '450',
  '500',
  '550',
  '560',
  '580',
  '600',
] as const;

const MERCEDES_CLASSES = ['CLA', 'CLS', 'A', 'C', 'E', 'S', 'G'] as const;
const AMG_NUMBERS = ['43', '53', '63', '65'] as const;
const AMG_STYLIZED_NUMBERS: Record<string, (typeof AMG_NUMBERS)[number]> = {
  '043': '43',
  '053': '53',
  '063': '63',
};

const AUDI_CODES = [
  'RS3',
  'RS4',
  'RS5',
  'RS6',
  'RS7',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'Q3',
  'Q5',
  'Q7',
  'Q8',
  'R8',
] as const;

const PORSCHE_CODES = ['GT2', 'GT3', 'GT4', '911', '718', '918', '992', '991', '997', '996', 'TURBO'] as const;
const VOLKSWAGEN_CODES = ['GTI', 'R32', 'R36', 'GOLF', 'PASSAT'] as const;
const PERFORMANCE_CODES = ['TYPER', 'EVO', 'STI', 'GTR', 'NISMO', 'VTEC', 'V8', 'V10', 'V12'] as const;

const PREMIUM_ENDINGS = ['001', '007', '111', '222', '333', '500', '550', '777', '888', '999'] as const;
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y']);
const BRAND_WORDS = new Set([
  'AMG',
  'AUDI',
  'BMW',
  'CLA',
  'CLS',
  'EVO',
  'GOLF',
  'GTR',
  'NISMO',
  'PASSAT',
  'STI',
  'TURBO',
  'VTEC',
]);

const LEET_SUBSTITUTIONS: Record<string, readonly string[]> = {
  '0': ['O'],
  '1': ['I', 'L'],
  '2': ['Z'],
  '3': ['E'],
  '4': ['A'],
  '5': ['S'],
  '6': ['G'],
  '7': ['T'],
  '8': ['B'],
  '9': ['G', 'P'],
};

type HiddenMeaningType = 'name' | 'word';

type HiddenMeaningEntry = {
  value: string;
  type: HiddenMeaningType;
};

const HIDDEN_MEANINGS: HiddenMeaningEntry[] = [
  { value: 'MATAS', type: 'name' },
  { value: 'DOMAS', type: 'name' },
  { value: 'TOMAS', type: 'name' },
  { value: 'JONAS', type: 'name' },
  { value: 'ROKAS', type: 'name' },
  { value: 'PAULIUS', type: 'name' },
  { value: 'LAURA', type: 'name' },
  { value: 'IEVA', type: 'name' },
  { value: 'LUKAS', type: 'name' },
  { value: 'EMILIS', type: 'name' },
  { value: 'GABRIELIUS', type: 'name' },
  { value: 'GABIJA', type: 'name' },
  { value: 'MIGLE', type: 'name' },
  { value: 'AUSTEJA', type: 'name' },
  { value: 'KAROLIS', type: 'name' },
  { value: 'MANTAS', type: 'name' },
  { value: 'DOVYDAS', type: 'name' },
  { value: 'BENAS', type: 'name' },
  { value: 'NOJUS', type: 'name' },
  { value: 'MARTYNAS', type: 'name' },
  { value: 'JUSTAS', type: 'name' },
  { value: 'VILIUS', type: 'name' },
  { value: 'SIMAS', type: 'name' },
  { value: 'EDVINAS', type: 'name' },
  { value: 'DEIVIDAS', type: 'name' },
  { value: 'ARNAS', type: 'name' },
  { value: 'GRETA', type: 'name' },
  { value: 'MONIKA', type: 'name' },
  { value: 'KAMILA', type: 'name' },
  { value: 'UGNE', type: 'name' },
  { value: 'RUTA', type: 'name' },
  { value: 'AISTE', type: 'name' },
  { value: 'EMA', type: 'name' },
  { value: 'BOSS', type: 'word' },
  { value: 'KING', type: 'word' },
  { value: 'QUEEN', type: 'word' },
  { value: 'GOD', type: 'word' },
  { value: 'LUX', type: 'word' },
  { value: 'VIP', type: 'word' },
  { value: 'TOP', type: 'word' },
  { value: 'FAST', type: 'word' },
  { value: 'TURBO', type: 'word' },
  { value: 'DRIFT', type: 'word' },
  { value: 'RACE', type: 'word' },
  { value: 'POWER', type: 'word' },
  { value: 'GOLD', type: 'word' },
  { value: 'BLACK', type: 'word' },
  { value: 'WHITE', type: 'word' },
  { value: 'RED', type: 'word' },
  { value: 'BLUE', type: 'word' },
  { value: 'LT', type: 'word' },
  { value: 'VILNIUS', type: 'word' },
  { value: 'KAUNAS', type: 'word' },
  { value: 'KLAIPEDA', type: 'word' },
];

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function analyzePlate(plate: string, context?: PlateAnalysisContext): PlateAnalysis {
  const normalized = normalizePlate(plate);
  const normalizedContext = normalizeAnalysisContext(context);
  const factors: PlateAnalysisFactor[] = [];
  const badges: string[] = [];
  const insights: string[] = [];
  const detectedMeanings: string[] = [];
  const symbolInsights: string[] = [];
  const factorKeys = new Set<string>();

  let score = 0;

  const addBadge = (badge: string) => {
    if (!badges.includes(badge)) badges.push(badge);
  };

  const addInsight = (insight: string) => {
    if (!insights.includes(insight)) insights.push(insight);
  };

  const addMeaning = (meaning: string) => {
    if (!detectedMeanings.includes(meaning)) detectedMeanings.push(meaning);
  };

  const addSymbolInsight = (insight: string) => {
    if (!symbolInsights.includes(insight)) symbolInsights.push(insight);
  };

  const addFactor = (
    name: string,
    scoreImpact: number,
    description: string,
    options?: { badge?: string; meaning?: string },
  ) => {
    const key = `${name}:${description}`;
    if (factorKeys.has(key)) return;
    factorKeys.add(key);
    factors.push({ name, scoreImpact, description });
    score += scoreImpact;
    addInsight(description);
    if (options?.badge) addBadge(options.badge);
    if (options?.meaning) addMeaning(options.meaning);
  };

  if (!normalized) {
    return {
      score: 0,
      label: getLabel(0),
      badges: [],
      insights: ['Numerio analizei reikia bent vieno raidės arba skaičiaus simbolio.'],
      detectedMeanings: [],
      factors: [],
      symbolInsights: [],
      audienceInsights: ['Žmogui, kuriam šis derinys turi asmeninę reikšmę'],
      similarPlateIdeas: [],
      dimensions: emptyDimensions(),
    };
  }

  const alphaTokens = normalized.match(/[A-Z]+/g) ?? [];
  const numericTokens = normalized.match(/\d+/g) ?? [];
  const lettersOnly = alphaTokens.join('');
  const digitsOnly = numericTokens.join('');

  detectPatternFactors({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
    addFactor,
    addBadge,
    addMeaning,
    addInsight,
  });

  detectHiddenMeanings({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
    addFactor,
    addBadge,
    addMeaning,
    addInsight,
  });

  detectCarReferences({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
    addFactor,
    addBadge,
    addMeaning,
    addInsight,
  });

  detectContextInsights({
    normalizedContext,
    normalized,
    addFactor,
    addBadge,
    addSymbolInsight,
    addInsight,
  });

  if (factors.length === 0) {
    addInsight('Derinys atrodo įprastas; ryškių raštų ar atpažįstamų automobilių nuorodų neaptikta.');
  }

  const cappedScore = Math.min(100, Math.max(0, score));
  const audienceInsights = buildAudienceInsights({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
    badges,
    detectedMeanings,
    factors,
    normalizedContext,
  });
  const similarPlateIdeas = buildSimilarPlateIdeas({
    normalized,
    alphaTokens,
    numericTokens,
    lettersOnly,
    digitsOnly,
    detectedMeanings,
  });
  const dimensions = buildDimensions({
    normalized,
    score: cappedScore,
    factors,
    badges,
    detectedMeanings,
    normalizedContext,
  });

  return {
    score: cappedScore,
    label: getLabel(cappedScore),
    badges,
    insights,
    detectedMeanings,
    factors,
    symbolInsights,
    audienceInsights,
    similarPlateIdeas,
    dimensions,
  };
}

type DetectionContext = {
  normalized: string;
  alphaTokens: string[];
  numericTokens: string[];
  lettersOnly: string;
  digitsOnly: string;
  addFactor: (
    name: string,
    scoreImpact: number,
    description: string,
    options?: { badge?: string; meaning?: string },
  ) => void;
  addBadge: (badge: string) => void;
  addMeaning: (meaning: string) => void;
  addInsight: (insight: string) => void;
};

type NormalizedAnalysisContext = {
  symbol: 'eu' | 'vytis' | 'flag' | null;
  type: 'car' | 'motorcycle' | 'personalized' | 'standard' | 'historical' | 'other' | null;
};

type ContextDetectionContext = {
  normalizedContext: NormalizedAnalysisContext;
  normalized: string;
  addFactor: (
    name: string,
    scoreImpact: number,
    description: string,
    options?: { badge?: string; meaning?: string },
  ) => void;
  addBadge: (badge: string) => void;
  addSymbolInsight: (insight: string) => void;
  addInsight: (insight: string) => void;
};

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
  if (['motorcycle', 'moto', 'motociklo', 'motociklu', 'motociklų'].includes(value)) {
    return 'motorcycle';
  }
  if (['personalized', 'vardinis', 'vardiniai', 'vanity'].includes(value)) {
    return 'personalized';
  }
  if (['standard', 'standartinis'].includes(value)) return 'standard';
  if (['car', 'auto', 'automobilio', 'automobiliu', 'automobilių'].includes(value)) return 'car';
  if (['historical', 'istorinis', 'istoriniai'].includes(value)) return 'historical';
  if (value === 'other' || value === 'kita' || value === 'kiti') return 'other';
  return null;
}

function detectPatternFactors({
  normalized,
  alphaTokens,
  numericTokens,
  lettersOnly,
  digitsOnly,
  addFactor,
}: DetectionContext) {
  const repeatedLetters = lettersOnly.match(/([A-Z])\1{2,}/g)?.[0];
  if (repeatedLetters) {
    addFactor(
      'Pasikartojančios raidės',
      15,
      `Raidžių seka ${repeatedLetters} atrodo tvarkingai ir gali būti lengvai įsimenama.`,
      { badge: 'Pasikartojančios raidės' },
    );
  }

  const repeatedNumbers = digitsOnly.match(/(\d)\1{2,}/g)?.[0];
  if (repeatedNumbers) {
    addFactor(
      'Pasikartojantys skaičiai',
      15,
      `Skaičių seka ${repeatedNumbers} dažnai atrodo stipriai ir kolekcininkams gali būti įdomi.`,
      { badge: 'Pasikartojantys skaičiai' },
    );
  }

  const sequence = findSequentialRun(digitsOnly);
  if (sequence) {
    addFactor(
      'Nuosekli skaičių seka',
      8,
      `Skaičiai ${sequence} sudaro aiškią seką, todėl derinys gali būti lengviau pastebimas.`,
      { badge: 'Skaičių seka' },
    );
  }

  const palindrome = findPalindrome([normalized, ...alphaTokens, ...numericTokens]);
  if (palindrome) {
    addFactor(
      'Palindromas',
      10,
      `Dalis ${palindrome} skaitoma vienodai iš abiejų pusių, todėl derinys atrodo simetriškai.`,
      { badge: 'Palindromas' },
    );
  }

  const uniqueChars = new Set(normalized.split('')).size;
  if (normalized.length <= 5) {
    addFactor(
      'Trumpas derinys',
      10,
      'Trumpas numeris yra lengviau įsimenamas ir gali atrodyti švaresnis.',
      { badge: 'Trumpas derinys' },
    );
  } else if (normalized.length <= 6 && uniqueChars <= 5) {
    addFactor(
      'Kompaktiškas derinys',
      8,
      'Derinys yra gana trumpas ir vizualiai neperkrautas.',
      { badge: 'Kompaktiškas' },
    );
  }

  if (normalized.length >= 5 && uniqueChars <= 3) {
    addFactor(
      'Mažai skirtingų simbolių',
      10,
      'Nedidelis skirtingų simbolių kiekis suteikia deriniui švarumo ir ritmiškumo.',
      { badge: 'Švarus raštas' },
    );
  }

  if (digitsOnly.includes('777')) {
    addFactor(
      'Sėkmingi skaičiai',
      15,
      'Skaičius 777 dažnai laikomas sėkmingu ir gali būti patrauklus pirkėjams.',
      { badge: '777' },
    );
  } else if (digitsOnly.includes('77')) {
    addFactor(
      'Sėkmingi skaičiai',
      10,
      'Skaičius 77 dažnai siejamas su sėkme ir lengvai įsimenamu raštu.',
      { badge: '77' },
    );
  } else if (digitsOnly.includes('7')) {
    addFactor(
      'Sėkmingas skaičius',
      4,
      'Skaičius 7 kai kuriems pirkėjams gali turėti teigiamą asociaciją.',
      { badge: '7' },
    );
  }

  const premiumEnding = PREMIUM_ENDINGS.find((ending) => digitsOnly.endsWith(ending));
  if (premiumEnding) {
    addFactor(
      'Patraukli pabaiga',
      10,
      `Pabaiga ${premiumEnding} atrodo tvarkingai ir dažnai naudojama premium tipo deriniuose.`,
      { badge: `Pabaiga ${premiumEnding}` },
    );
  }

  const wordLikeToken = alphaTokens.find(isWordLikeToken);
  if (wordLikeToken) {
    addFactor(
      'Žodį primenančios raidės',
      10,
      `Raidės ${wordLikeToken} primena vardą ar trumpą žodį, todėl derinys gali būti asmeniškesnis.`,
      { badge: 'Žodinis raštas', meaning: `Galimas vardas ar žodis: ${wordLikeToken}` },
    );
  }
}

function detectContextInsights({
  normalizedContext,
  normalized,
  addFactor,
  addBadge,
  addSymbolInsight,
  addInsight,
}: ContextDetectionContext) {
  if (normalizedContext.symbol === 'eu') {
    const insight = 'ES simbolis – šiuo metu įprastas ir plačiai atpažįstamas numerio formatas.';
    addBadge('ES formatas');
    addSymbolInsight(insight);
  }

  if (normalizedContext.symbol === 'vytis') {
    const insight = 'Vytis gali suteikti numeriui išskirtinumo ir patriotiškumo.';
    addFactor('Išskirtinis simbolis', 4, insight, { badge: 'Su Vyčiu' });
    addSymbolInsight(insight);
  }

  if (normalizedContext.symbol === 'flag') {
    const insight = 'Lietuvos vėliavos simbolis gali patikti ieškantiems ryškesnio lietuviško akcento.';
    addFactor('Lietuviškas akcentas', 4, insight, { badge: 'Su vėliava' });
    addSymbolInsight(insight);
  }

  if (normalizedContext.type === 'motorcycle') {
    const insight =
      'Motociklų numeriai turi kitokį formatą, todėl trumpi ar lengvai įsimenami deriniai gali atrodyti dar išskirtiniau.';
    addBadge('Motociklų numeris');
    addSymbolInsight(insight);
    if (normalized.length <= 5) {
      addInsight('Trumpas motociklo numerio derinys gali atrodyti kompaktiškai ir ryškiai.');
    }
  }

  if (normalizedContext.type === 'personalized') {
    addBadge('Vardinis derinys');
    addSymbolInsight('Vardinis tipas pabrėžia asmeninę numerio reikšmę ir lengvesnį įsimenamumą.');
  }

  if (normalizedContext.type === 'standard') {
    addSymbolInsight('Standartinis formatas vertinamas pagal patį raidžių ir skaičių derinį, jo ritmą ir įsimenamumą.');
  }
}

type SubstitutionUse = {
  digit: string;
  letter: string;
};

type ReadableVariant = {
  text: string;
  substitutions: SubstitutionUse[];
};

type HiddenCandidate = {
  entry: HiddenMeaningEntry;
  confidence: 'exact' | 'strong' | 'weak';
  substitutions: SubstitutionUse[];
};

function detectHiddenMeanings({
  normalized,
  addFactor,
  addBadge,
  addMeaning,
  addInsight,
}: DetectionContext) {
  const candidate = findHiddenMeaningCandidate(normalized);
  if (!candidate) return;

  const displayValue = formatMeaningValue(candidate.entry);
  const isName = candidate.entry.type === 'name';
  const confidenceImpact = {
    exact: 20,
    strong: 12,
    weak: 6,
  }[candidate.confidence];
  const factorDescription =
    candidate.confidence === 'exact'
      ? `Šis derinys gali būti skaitomas kaip „${candidate.entry.value}“.`
      : `Gali priminti ${isName ? 'vardą' : 'žodį'} „${candidate.entry.value}“.`;

  addFactor('Paslėpta reikšmė', confidenceImpact, factorDescription, {
    badge: 'Paslėpta reikšmė',
    meaning:
      candidate.confidence === 'exact'
        ? `Gali būti skaitoma kaip „${candidate.entry.value}“.`
        : `Gali priminti žodį arba vardą „${candidate.entry.value}“.`,
  });

  addBadge('Lengvai įsimenamas');
  if (isName) {
    addBadge('Vardinis derinys');
    addInsight(`Toks derinys gali būti įdomus žmogui vardu ${displayValue}.`);
  } else {
    addInsight(`Žodis „${candidate.entry.value}“ gali suteikti deriniui aiškesnę asociaciją.`);
  }

  const substitutionInsight = describeSubstitutions(candidate.substitutions);
  if (substitutionInsight) addInsight(substitutionInsight);
}

function findHiddenMeaningCandidate(normalized: string): HiddenCandidate | null {
  const variants = generateReadableVariants(normalized);
  const candidates: HiddenCandidate[] = [];

  for (const entry of HIDDEN_MEANINGS) {
    for (const variant of variants) {
      if (variant.substitutions.length === 0) continue;

      if (variant.text === entry.value) {
        candidates.push({
          entry,
          confidence: 'exact',
          substitutions: variant.substitutions,
        });
        continue;
      }

      if (isStrongNearHiddenMatch(variant.text, entry.value)) {
        candidates.push({
          entry,
          confidence: 'strong',
          substitutions: variant.substitutions,
        });
        continue;
      }

      if (isWeakHiddenMatch(variant.text, entry.value)) {
        candidates.push({
          entry,
          confidence: 'weak',
          substitutions: variant.substitutions,
        });
      }
    }
  }

  return candidates.sort(compareHiddenCandidates)[0] ?? null;
}

function generateReadableVariants(normalized: string, maxVariants = 512): ReadableVariant[] {
  let variants: ReadableVariant[] = [{ text: '', substitutions: [] }];

  for (const char of normalized) {
    const options = [
      { text: char, substitution: null },
      ...(LEET_SUBSTITUTIONS[char] ?? []).map((letter) => ({
        text: letter,
        substitution: { digit: char, letter },
      })),
    ];

    const next: ReadableVariant[] = [];
    for (const variant of variants) {
      for (const option of options) {
        next.push({
          text: `${variant.text}${option.text}`,
          substitutions: option.substitution
            ? [...variant.substitutions, option.substitution]
            : variant.substitutions,
        });
      }
    }

    variants = dedupeVariants(next).slice(0, maxVariants);
  }

  return variants;
}

function dedupeVariants(variants: ReadableVariant[]): ReadableVariant[] {
  const byText = new Map<string, ReadableVariant>();
  for (const variant of variants) {
    const existing = byText.get(variant.text);
    if (!existing || variant.substitutions.length < existing.substitutions.length) {
      byText.set(variant.text, variant);
    }
  }
  return Array.from(byText.values());
}

function isStrongNearHiddenMatch(readable: string, target: string): boolean {
  if (target.length < 4) return false;
  if (Math.abs(readable.length - target.length) > 1) return false;

  if (
    readable.length === target.length + 1 &&
    (readable.startsWith(target) || removeOneRepeatedCharacter(readable).includes(target))
  ) {
    return true;
  }

  if (readable.length === target.length && hammingDistance(readable, target) === 1) {
    return true;
  }

  return false;
}

function isWeakHiddenMatch(readable: string, target: string): boolean {
  if (target.length < 4) return false;
  if (Math.abs(readable.length - target.length) > 2) return false;
  return readable.includes(target) || target.includes(readable);
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

function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) distance += 1;
  }
  return distance;
}

function compareHiddenCandidates(a: HiddenCandidate, b: HiddenCandidate): number {
  const confidenceRank = { exact: 3, strong: 2, weak: 1 };
  const confidenceDiff = confidenceRank[b.confidence] - confidenceRank[a.confidence];
  if (confidenceDiff !== 0) return confidenceDiff;

  const lengthDiff = b.entry.value.length - a.entry.value.length;
  if (lengthDiff !== 0) return lengthDiff;

  return a.substitutions.length - b.substitutions.length;
}

function describeSubstitutions(substitutions: SubstitutionUse[]): string | null {
  const unique = Array.from(
    new Map(substitutions.map((substitution) => [`${substitution.digit}:${substitution.letter}`, substitution])).values(),
  );

  if (unique.length === 0) return null;
  if (unique.length === 1) {
    const [substitution] = unique;
    return `Skaičius ${substitution.digit} dažnai naudojamas kaip raidė ${substitution.letter}.`;
  }

  const digits = joinLithuanianList(unique.map((substitution) => substitution.digit));
  const letters = joinLithuanianList(unique.map((substitution) => substitution.letter));
  return `Skaičiai ${digits} gali priminti raides ${letters}.`;
}

function joinLithuanianList(values: string[]): string {
  if (values.length <= 1) return values[0] ?? '';
  return `${values.slice(0, -1).join(', ')} ir ${values[values.length - 1]}`;
}

function formatMeaningValue(entry: HiddenMeaningEntry): string {
  if (entry.type === 'word') return entry.value;
  return `${entry.value.slice(0, 1)}${entry.value.slice(1).toLowerCase()}`;
}

type CarDetectionContext = DetectionContext & {
  addBadge: (badge: string) => void;
  addMeaning: (meaning: string) => void;
};

function detectCarReferences({
  normalized,
  alphaTokens,
  numericTokens,
  lettersOnly,
  digitsOnly,
  addFactor,
  addBadge,
  addMeaning,
}: CarDetectionContext) {
  const containsBMW = lettersOnly.includes('BMW');
  const bmwModel = findNumberReference(numericTokens, BMW_MODEL_NUMBERS);
  const bmwCode = findBmwSeriesCode(normalized, containsBMW);

  if (containsBMW && bmwModel) {
    addFactor(
      'BMW modelio nuoroda',
      25,
      `Derinys gali būti patrauklus BMW entuziastams, nes BMW ir ${bmwModel} primena BMW modelį.`,
      { badge: 'BMW', meaning: `BMW ${bmwModel}` },
    );
  } else if (containsBMW) {
    addFactor(
      'BMW raidės',
      12,
      'Raidės BMW turi aiškią automobilių markės asociaciją.',
      { badge: 'BMW', meaning: 'BMW markės nuoroda' },
    );
  }

  if (bmwCode) {
    addFactor(
      'BMW serijos nuoroda',
      bmwCode.startsWith('M') ? 25 : 18,
      `Kodas ${bmwCode} dažnai siejamas su BMW modelių šeima.`,
      { badge: 'BMW', meaning: `BMW ${bmwCode}` },
    );
  }

  const mercedesContext = detectMercedesContext(alphaTokens, numericTokens);
  if (mercedesContext) {
    addFactor(
      mercedesContext.factorName,
      mercedesContext.impact,
      mercedesContext.description,
      { badge: mercedesContext.badge, meaning: mercedesContext.meaning },
    );
  }

  const audiCode = findAudiCode(normalized, alphaTokens, numericTokens);
  const rsDigit = ['3', '4', '5', '6', '7'].find((digit) => digitsOnly.includes(digit));
  const hasRsLetters = alphaTokens.some((token) => token === 'RS' || token.startsWith('RS'));
  if (audiCode) {
    addFactor(
      'Audi modelio nuoroda',
      audiCode.startsWith('RS') || audiCode === 'R8' ? 26 : 18,
      `Kodas ${audiCode} primena Audi modelį ir gali būti įdomus markės gerbėjams.`,
      { badge: audiCode.startsWith('RS') ? 'Audi RS' : 'Audi', meaning: `Audi ${audiCode}` },
    );
    addBadge('Automobilių nuoroda');
    addBadge('Automobilių entuziastams');
  } else if (hasRsLetters && rsDigit) {
    addFactor(
      'Audi RS nuoroda',
      25,
      `Raidės RS ir skaičius ${rsDigit} gali priminti Audi RS${rsDigit}.`,
      { badge: 'Audi RS', meaning: `Galima Audi RS${rsDigit} nuoroda` },
    );
    addBadge('Automobilių nuoroda');
    addBadge('Automobilių entuziastams');
  }

  const porscheCode = findContainedCode(normalized, PORSCHE_CODES);
  if (porscheCode) {
    addFactor(
      'Porsche nuoroda',
      porscheCode.startsWith('GT') || porscheCode === '911' ? 30 : 24,
      `Kodas ${porscheCode} dažnai siejamas su Porsche ir gali būti patrauklus sportinių automobilių entuziastams.`,
      { badge: 'Porsche', meaning: `Porsche ${porscheCode}` },
    );
  }

  const vwCode = findContainedCode(normalized, VOLKSWAGEN_CODES);
  if (vwCode) {
    addFactor(
      'Volkswagen nuoroda',
      vwCode === 'GTI' || vwCode.startsWith('R') ? 20 : 14,
      `Kodas ${vwCode} primena Volkswagen modelių ar versijų pasaulį.`,
      { badge: 'Volkswagen', meaning: `Volkswagen ${vwCode}` },
    );
  }

  const performanceCode = findContainedCode(normalized, PERFORMANCE_CODES);
  if (performanceCode) {
    addFactor(
      'Performance nuoroda',
      22,
      `Kodas ${formatPerformanceCode(performanceCode)} dažnai siejamas su sportiškumu ar automobilių entuziastų kultūra.`,
      { badge: 'Performance', meaning: formatPerformanceCode(performanceCode) },
    );
  }

  const sharedModel = findSharedMercedesBmwReference(numericTokens);
  if (!containsBMW && !bmwCode && !mercedesContext && sharedModel) {
    addFactor(
      'Galima premium modelio nuoroda',
      10,
      `Skaičius ${sharedModel} gali priminti BMW arba Mercedes-Benz modelių žymėjimą.`,
      { badge: 'Premium modelis', meaning: `Galima BMW / Mercedes-Benz ${sharedModel} nuoroda` },
    );
  } else if (!containsBMW && !bmwCode && !sharedModel && bmwModel) {
    addFactor(
      'Galima BMW modelio nuoroda',
      10,
      `Skaičius ${bmwModel} gali priminti BMW modelį, nors markė derinyje nėra tiesiogiai nurodyta.`,
      { badge: 'Galima BMW nuoroda', meaning: `Galimas BMW ${bmwModel}` },
    );
  }

  const amgStylized = numericTokens.find((token) => AMG_STYLIZED_NUMBERS[token]);
  if (!mercedesContext && amgStylized) {
    const amgNumber = AMG_STYLIZED_NUMBERS[amgStylized];
    addFactor(
      'Galima AMG nuoroda',
      12,
      `Skaičiai ${amgStylized} gali būti stilizuota AMG ${amgNumber} nuoroda.`,
      { badge: 'Galima AMG', meaning: `Galima AMG ${amgNumber} nuoroda` },
    );
  }

  if (detectedMeaningsHasCarReference(normalized, lettersOnly)) {
    addBadge('Automobilių nuoroda');
    addBadge('Automobilių entuziastams');
  }

  // These calls intentionally keep the dictionary in this file discoverable
  // for future expansion even when only a weak reference was detected.
  void addBadge;
  void addMeaning;
}

function detectMercedesContext(
  alphaTokens: string[],
  numericTokens: string[],
):
  | {
      factorName: string;
      impact: number;
      description: string;
      badge: string;
      meaning: string;
    }
  | null {
  const hasAMG = alphaTokens.some((token) => token.includes('AMG'));
  const classCode = findMercedesClass(alphaTokens);
  const amgNumber = findAmgNumber(numericTokens);
  const mercedesModel = findNumberReference(numericTokens, MERCEDES_MODEL_NUMBERS);

  if ((hasAMG || classCode) && amgNumber) {
    const modelName = classCode ? `${classCode} ${amgNumber}` : amgNumber;
    return {
      factorName: 'Mercedes-AMG nuoroda',
      impact: hasAMG ? 30 : 26,
      description: `Derinys primena Mercedes-AMG ${modelName}; tokios nuorodos entuziastams gali būti įdomios.`,
      badge: 'Mercedes-AMG',
      meaning: `Mercedes-AMG ${modelName}`,
    };
  }

  if (hasAMG) {
    return {
      factorName: 'AMG nuoroda',
      impact: 22,
      description: 'Raidės AMG dažnai siejamos su Mercedes-Benz sportiškomis versijomis.',
      badge: 'AMG',
      meaning: 'Mercedes-AMG',
    };
  }

  if (classCode && mercedesModel) {
    return {
      factorName: 'Mercedes-Benz modelio nuoroda',
      impact: 20,
      description: `Derinys gali priminti Mercedes-Benz ${classCode} ${mercedesModel}.`,
      badge: 'Mercedes-Benz',
      meaning: `Mercedes-Benz ${classCode} ${mercedesModel}`,
    };
  }

  if (mercedesModel) {
    return {
      factorName: 'Galima Mercedes-Benz nuoroda',
      impact: 8,
      description: `Skaičius ${mercedesModel} gali priminti Mercedes-Benz modelių žymėjimą.`,
      badge: 'Galima Mercedes nuoroda',
      meaning: `Galimas Mercedes-Benz ${mercedesModel}`,
    };
  }

  return null;
}

type AudienceInput = {
  normalized: string;
  alphaTokens: string[];
  numericTokens: string[];
  lettersOnly: string;
  digitsOnly: string;
  badges: string[];
  detectedMeanings: string[];
  factors: PlateAnalysisFactor[];
  normalizedContext: NormalizedAnalysisContext;
};

function buildAudienceInsights({
  normalized,
  alphaTokens,
  numericTokens,
  lettersOnly,
  digitsOnly,
  badges,
  detectedMeanings,
  factors,
  normalizedContext,
}: AudienceInput): string[] {
  const audience: string[] = [];
  const addAudience = (value: string) => {
    if (!audience.includes(value)) audience.push(value);
  };

  const bmwModel = findNumberReference(numericTokens, BMW_MODEL_NUMBERS);
  const containsBMW = lettersOnly.includes('BMW');
  const bmwCode = findBmwSeriesCode(normalized, containsBMW);
  if (containsBMW || bmwCode || detectedMeanings.some((meaning) => meaning.includes('BMW'))) {
    addAudience('BMW entuziastams');
    if (bmwModel) addAudience(`BMW ${bmwModel[0]} serijos savininkams`);
    addAudience('Automobilių kolekcininkams');
  }

  const audiCode = findAudiCode(normalized, alphaTokens, numericTokens);
  const hasRsLetters = alphaTokens.some((token) => token === 'RS' || token.startsWith('RS'));
  if (audiCode || hasRsLetters) {
    addAudience('Audi entuziastams');
    if ((audiCode?.startsWith('RS') ?? false) || hasRsLetters) {
      addAudience('Sportinių automobilių mėgėjams');
    }
  }

  if (findContainedCode(normalized, PORSCHE_CODES)) {
    addAudience('Porsche entuziastams');
    addAudience('Sportinių automobilių mėgėjams');
  }

  if (lettersOnly.includes('AMG') || factors.some((factor) => factor.name.includes('AMG') || factor.name.includes('Mercedes'))) {
    addAudience('Mercedes-AMG entuziastams');
    addAudience('Sportinių automobilių mėgėjams');
  }

  const hiddenName = findDetectedName(detectedMeanings);
  if (hiddenName) {
    addAudience(`Žmogui vardu ${formatDisplayWord(hiddenName)}`);
    addAudience('Ieškantiems vardinio numerio');
    addAudience('Norintiems lengvai įsimenamo derinio');
  } else if (badges.includes('Vardinis derinys') || normalizedContext.type === 'personalized') {
    addAudience('Ieškantiems vardinio numerio');
  }

  if (
    badges.some((badge) =>
      ['Pasikartojančios raidės', 'Pasikartojantys skaičiai', 'Palindromas', 'Švarus raštas'].includes(badge),
    ) ||
    digitsOnly.match(/(\d)\1{2,}/) ||
    lettersOnly.match(/([A-Z])\1{2,}/)
  ) {
    addAudience('Kolekcininkams, mėgstantiems simetriškus derinius');
    addAudience('Ieškantiems labai lengvai įsimenamo numerio');
  }

  if (normalizedContext.type === 'motorcycle') {
    addAudience('Motociklų entuziastams');
  }

  if (audience.length === 0) {
    addAudience('Žmogui, kuriam šis derinys turi asmeninę reikšmę');
    addAudience('Ieškantiems paprasto ir aiškaus numerio');
  }

  return audience.slice(0, 5);
}

type SimilarIdeasInput = {
  normalized: string;
  alphaTokens: string[];
  numericTokens: string[];
  lettersOnly: string;
  digitsOnly: string;
  detectedMeanings: string[];
};

function buildSimilarPlateIdeas({
  normalized,
  alphaTokens,
  numericTokens,
  lettersOnly,
  digitsOnly,
  detectedMeanings,
}: SimilarIdeasInput): string[] {
  const ideas: string[] = [];
  const addIdea = (idea: string) => {
    const clean = normalizePlate(idea).slice(0, 8);
    if (clean && clean !== normalized && !ideas.includes(clean)) ideas.push(clean);
  };

  const bmwModel = findNumberReference(numericTokens, BMW_MODEL_NUMBERS);
  if (lettersOnly.includes('BMW') && bmwModel) {
    const series = bmwModel[0];
    const seriesModels = BMW_MODEL_NUMBERS.filter((model) => model.startsWith(series));
    const currentIndex = seriesModels.indexOf(bmwModel);
    const nearbyModels =
      currentIndex >= 0
        ? [...seriesModels.slice(currentIndex + 1), ...seriesModels.slice(Math.max(0, currentIndex - 2), currentIndex)]
        : seriesModels;
    nearbyModels.slice(0, 4).forEach((model) => addIdea(`BMW${model}`));
    addIdea('BMW777');
  }

  const audiCode = findAudiCode(normalized, alphaTokens, numericTokens);
  const hasRsLetters = alphaTokens.some((token) => token === 'RS' || token.startsWith('RS'));
  if (audiCode?.startsWith('RS') || hasRsLetters) {
    ['RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'S6', 'RS777'].forEach(addIdea);
  }

  const porscheCode = findContainedCode(normalized, PORSCHE_CODES);
  if (porscheCode) {
    ['GT2', 'GT3', 'GT4', '911', '992', 'GT777'].forEach(addIdea);
  }

  if (lettersOnly.includes('AMG') || normalized.includes('063')) {
    ['AMG043', 'AMG053', 'AMG063', 'S063', 'G063', 'AMG777'].forEach(addIdea);
  }

  const hiddenName = findDetectedName(detectedMeanings);
  if (hiddenName) {
    const prefix = alphaTokens[0]?.slice(0, 3) || hiddenName.slice(0, 3);
    [`${prefix}444`, `${prefix}777`, `${prefix}111`, toLeetVariant(hiddenName), hiddenName].forEach(addIdea);
  }

  if (lettersOnly.match(/([A-Z])\1{2,}/) || digitsOnly.match(/(\d)\1{2,}/)) {
    const repeatedLetters = lettersOnly.match(/([A-Z])\1{2,}/)?.[0] ?? `${lettersOnly[0] ?? 'A'}`.repeat(3);
    const repeatedNumbers = digitsOnly.match(/(\d)\1{2,}/)?.[0] ?? '111';
    addIdea(`${repeatedLetters}777`);
    addIdea(`BBB${repeatedNumbers}`);
    addIdea(`${repeatedLetters}999`);
    addIdea(`ABA${repeatedNumbers}`);
  }

  if (ideas.length < 3) {
    const letterBase = alphaTokens[0]?.slice(0, 3) || lettersOnly.slice(0, 3) || 'UNI';
    [`${letterBase}777`, `${letterBase}111`, `${letterBase}999`, `${letterBase}007`].forEach(addIdea);
  }

  return ideas.slice(0, 8);
}

type DimensionsInput = {
  normalized: string;
  score: number;
  factors: PlateAnalysisFactor[];
  badges: string[];
  detectedMeanings: string[];
  normalizedContext: NormalizedAnalysisContext;
};

function buildDimensions({
  normalized,
  score,
  factors,
  badges,
  detectedMeanings,
  normalizedContext,
}: DimensionsInput): PlateAnalysisDimensions {
  const factorNames = factors.map((factor) => factor.name);
  const hasPattern = factorNames.some((name) =>
    ['Pasikartojančios raidės', 'Pasikartojantys skaičiai', 'Nuosekli skaičių seka', 'Palindromas', 'Mažai skirtingų simbolių', 'Patraukli pabaiga'].includes(name),
  );
  const carImpact = factors
    .filter((factor) =>
      /BMW|Audi|Mercedes|AMG|Porsche|Volkswagen|Performance|premium/i.test(factor.name),
    )
    .reduce((sum, factor) => sum + factor.scoreImpact, 0);
  const patternImpact = factors
    .filter((factor) =>
      /Pasikartoj|Nuosekli|Palindromas|Trumpas|Kompaktiškas|skirtingų|pabaiga|Sėkming/i.test(factor.name),
    )
    .reduce((sum, factor) => sum + factor.scoreImpact, 0);
  const hiddenImpact = factors
    .filter((factor) => /Paslėpta|Žodį/i.test(factor.name))
    .reduce((sum, factor) => sum + factor.scoreImpact, 0);
  const hasHiddenMeaning = detectedMeanings.some((meaning) => meaning.includes('„') || meaning.includes('vard'));
  const symbolBoost = normalizedContext.symbol === 'vytis' || normalizedContext.symbol === 'flag' ? 8 : 0;

  return {
    memorability: clampScore(
      score * 0.45 +
        (normalized.length <= 5 ? 18 : normalized.length <= 6 ? 10 : 4) +
        (badges.includes('Lengvai įsimenamas') ? 18 : 0) +
        (hasPattern ? 14 : 0),
    ),
    patternStrength: clampScore(patternImpact * 3.2 + (hasPattern ? 18 : 0)),
    hiddenMeaning: clampScore(hiddenImpact * 3.5 + (hasHiddenMeaning ? 16 : 0)),
    automotiveAppeal: clampScore(carImpact * 3.1 + (badges.includes('Automobilių entuziastams') ? 12 : 0)),
    collectorAppeal: clampScore(score * 0.55 + patternImpact * 1.2 + carImpact * 0.8 + symbolBoost),
  };
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

function findDetectedName(detectedMeanings: string[]): string | null {
  for (const meaning of detectedMeanings) {
    const match = meaning.match(/„([^“]+)“/);
    const value = match?.[1]?.toUpperCase();
    if (!value) continue;
    const entry = HIDDEN_MEANINGS.find((candidate) => candidate.value === value && candidate.type === 'name');
    if (entry) return entry.value;
  }
  return null;
}

function formatDisplayWord(value: string): string {
  return `${value.slice(0, 1)}${value.slice(1).toLowerCase()}`;
}

function toLeetVariant(value: string): string {
  return value
    .replace(/O/g, '0')
    .replace(/A/g, '4')
    .replace(/S/g, '5')
    .replace(/I/g, '1')
    .replace(/T/g, '7');
}

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
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
    if (b === a + 1 && c === b + 1) {
      return digits.slice(i, i + 3);
    }
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

function isWordLikeToken(token: string): boolean {
  if (token.length < 4 || token.length > 6 || BRAND_WORDS.has(token)) return false;
  const chars = token.split('');
  const hasVowel = chars.some((char) => VOWELS.has(char));
  const hasConsonant = chars.some((char) => !VOWELS.has(char));
  return hasVowel && hasConsonant && !/([A-Z])\1{2,}/.test(token);
}

function stripLeadingZeros(value: string): string {
  return value.replace(/^0+/, '') || '0';
}

function findNumberReference<T extends string>(
  numericTokens: string[],
  references: readonly T[],
): T | null {
  return (
    references.find((reference) =>
      numericTokens.some(
        (token) => token === reference || stripLeadingZeros(token) === stripLeadingZeros(reference),
      ),
    ) ?? null
  );
}

function findContainedCode<T extends string>(normalized: string, codes: readonly T[]): T | null {
  return [...codes].sort((a, b) => b.length - a.length).find((code) => normalized.includes(code)) ?? null;
}

function findAudiCode(
  normalized: string,
  alphaTokens: string[],
  numericTokens: string[],
): (typeof AUDI_CODES)[number] | null {
  for (const code of [...AUDI_CODES].sort((a, b) => b.length - a.length)) {
    if (normalized === code) return code;

    if (code.startsWith('RS')) {
      const digit = code.slice(2);
      if (normalized.startsWith(code)) return code;
      if (alphaTokens.some((token) => token === 'RS') && numericTokens.some((token) => tokenStartsWithDigit(token, digit))) {
        return code;
      }
      continue;
    }

    if (/^[ASQ]\d$/.test(code) || code === 'R8') {
      const letter = code[0];
      const digit = code[1];
      if (normalized.startsWith(code)) return code;
      if (alphaTokens.some((token) => token === letter) && numericTokens.some((token) => tokenStartsWithDigit(token, digit))) {
        return code;
      }
    }
  }

  return null;
}

function tokenStartsWithDigit(token: string, digit: string): boolean {
  return token.startsWith(digit) || stripLeadingZeros(token).startsWith(digit);
}

function findBmwSeriesCode(
  normalized: string,
  containsBMW: boolean,
): (typeof BMW_SERIES_CODES)[number] | null {
  return (
    BMW_SERIES_CODES.find((code) =>
      normalized === code || (containsBMW && normalized.includes(code)),
    ) ?? null
  );
}

function findMercedesClass(alphaTokens: string[]): (typeof MERCEDES_CLASSES)[number] | null {
  return (
    MERCEDES_CLASSES.find((classCode) =>
      alphaTokens.some((token) => token === classCode),
    ) ?? null
  );
}

function findAmgNumber(numericTokens: string[]): (typeof AMG_NUMBERS)[number] | null {
  for (const token of numericTokens) {
    if (AMG_STYLIZED_NUMBERS[token]) return AMG_STYLIZED_NUMBERS[token];
    const stripped = stripLeadingZeros(token);
    if ((AMG_NUMBERS as readonly string[]).includes(stripped)) {
      return stripped as (typeof AMG_NUMBERS)[number];
    }
  }
  return null;
}

function findSharedMercedesBmwReference(numericTokens: string[]): string | null {
  const bmw = findNumberReference(numericTokens, BMW_MODEL_NUMBERS);
  const mercedes = findNumberReference(numericTokens, MERCEDES_MODEL_NUMBERS);
  return bmw && mercedes && bmw === mercedes ? bmw : null;
}

function formatPerformanceCode(code: string): string {
  if (code === 'TYPER') return 'Type R';
  return code;
}

function detectedMeaningsHasCarReference(normalized: string, lettersOnly: string): boolean {
  return (
    lettersOnly.includes('BMW') ||
    lettersOnly.includes('AMG') ||
    PORSCHE_CODES.some((code) => normalized.includes(code)) ||
    VOLKSWAGEN_CODES.some((code) => normalized.includes(code)) ||
    PERFORMANCE_CODES.some((code) => normalized.includes(code))
  );
}

/**
 * Future test examples:
 * - DOM455 -> DOMAS-like hidden meaning
 * - M4T45 -> MATAS
 * - J0N45 -> JONAS
 * - T0M45 -> TOMAS
 * - BMW530, BMW535
 * - AMG063, S063
 * - RS6, GT3
 * - AAA111
 * - MATAS
 */
