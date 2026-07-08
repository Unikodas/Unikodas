import type { KnowledgeBaseEntry, KnowledgeCategory, KnowledgeLanguage } from './schema';

type EntryInput = {
  keyword: string;
  displayName?: string;
  aliases?: readonly string[];
  category: KnowledgeCategory;
  subcategory: string;
  confidence?: number;
  language?: KnowledgeLanguage;
  country?: string | null;
  description?: string;
  collectorNotes?: string;
  relatedKeywords?: readonly string[];
  tags?: readonly string[];
};

export function createEntry(input: EntryInput): KnowledgeBaseEntry {
  return {
    keyword: input.keyword,
    displayName: input.displayName ?? input.keyword,
    aliases: input.aliases ?? [],
    category: input.category,
    subcategory: input.subcategory,
    confidence: input.confidence ?? 70,
    language: input.language ?? 'multi',
    country: input.country ?? null,
    description: input.description ?? `${input.displayName ?? input.keyword} gali būti atpažįstama reikšmė numerio derinyje.`,
    collectorNotes: input.collectorNotes ?? `${input.displayName ?? input.keyword} gali būti įdomu žmonėms, kuriems ši reikšmė artima.`,
    relatedKeywords: input.relatedKeywords ?? [],
    tags: input.tags ?? [],
  };
}

export function createEntries(
  category: KnowledgeCategory,
  subcategory: string,
  values: readonly (string | Omit<EntryInput, 'category' | 'subcategory'>)[],
  defaults: Partial<Omit<EntryInput, 'keyword' | 'category' | 'subcategory'>> = {},
): KnowledgeBaseEntry[] {
  return values.map((value) => {
    const input = typeof value === 'string' ? { keyword: value } : value;
    return createEntry({
      ...defaults,
      ...input,
      category,
      subcategory,
    });
  });
}

