export type KnowledgeLanguage = 'lt' | 'en' | 'de' | 'fr' | 'it' | 'ja' | 'multi' | 'unknown';

export type KnowledgeCategory =
  | 'cars'
  | 'motorcycles'
  | 'trucks'
  | 'engines'
  | 'gearboxes'
  | 'performance'
  | 'manufacturers'
  | 'supercars'
  | 'motorsport'
  | 'people'
  | 'lithuanian-names'
  | 'english-names'
  | 'nicknames'
  | 'famous-people'
  | 'athletes'
  | 'drivers'
  | 'musicians'
  | 'places'
  | 'countries'
  | 'cities'
  | 'villages'
  | 'airports'
  | 'roads'
  | 'brands'
  | 'luxury'
  | 'fashion'
  | 'technology'
  | 'gaming'
  | 'food'
  | 'aviation'
  | 'military'
  | 'ships'
  | 'space'
  | 'movies'
  | 'tv'
  | 'anime'
  | 'games'
  | 'business'
  | 'finance'
  | 'sports'
  | 'music'
  | 'internet'
  | 'common-words'
  | 'slang'
  | 'abbreviations'
  | 'roman-numerals'
  | 'chemical-elements'
  | 'greek-letters'
  | 'latin-words'
  | 'religion'
  | 'history'
  | 'mythology'
  | 'animals'
  | 'birds'
  | 'fish'
  | 'dogs'
  | 'cats'
  | 'luxury-watches'
  | 'alcohol'
  | 'cigars'
  | 'boats'
  | 'bikes'
  | 'tools'
  | 'construction'
  | 'agriculture'
  | 'universities'
  | 'government'
  | 'emergency'
  | 'medical'
  | 'science'
  | 'weather'
  | 'nature'
  | 'plate-concepts';

export type KnowledgeBaseEntry = {
  keyword: string;
  displayName: string;
  aliases: readonly string[];
  category: KnowledgeCategory;
  subcategory: string;
  confidence: number;
  language: KnowledgeLanguage;
  country: string | null;
  description: string;
  collectorNotes: string;
  relatedKeywords: readonly string[];
  tags: readonly string[];
};

export type NormalizedKnowledgeEntry = KnowledgeBaseEntry & {
  id: string;
  normalizedKeyword: string;
  normalizedDisplayName: string;
  normalizedAliases: readonly string[];
};

export type KnowledgeCategoryPack = {
  category: KnowledgeCategory;
  entries: readonly KnowledgeBaseEntry[];
};

export function defineKnowledgeEntries<const T extends readonly KnowledgeBaseEntry[]>(entries: T): T {
  return entries;
}
