import type { KnowledgeBaseEntry, KnowledgeCategory, KnowledgeLanguage } from './schema';

type RawKnowledgeEntry = Partial<KnowledgeBaseEntry> & {
  keyword: string;
  displayName?: string;
};

export function parseKnowledgeJsonEntries(
  category: KnowledgeCategory,
  rawEntries: readonly RawKnowledgeEntry[],
): KnowledgeBaseEntry[] {
  return rawEntries
    .filter((entry) => Boolean(entry.keyword))
    .map((entry) => ({
      keyword: entry.keyword,
      displayName: entry.displayName ?? entry.keyword,
      aliases: entry.aliases ?? [],
      category: entry.category ?? category,
      subcategory: entry.subcategory ?? 'general',
      confidence: clampConfidence(entry.confidence ?? 70),
      language: normalizeLanguage(entry.language),
      country: entry.country ?? null,
      description: entry.description ?? `${entry.displayName ?? entry.keyword} gali būti atpažįstama reikšmė numerio derinyje.`,
      collectorNotes: entry.collectorNotes ?? `${entry.displayName ?? entry.keyword} gali būti įdomu žmonėms, kuriems ši reikšmė artima.`,
      relatedKeywords: entry.relatedKeywords ?? [],
      tags: entry.tags ?? [],
    }));
}

function normalizeLanguage(language: KnowledgeLanguage | undefined): KnowledgeLanguage {
  return language ?? 'unknown';
}

function clampConfidence(confidence: number): number {
  return Math.min(100, Math.max(0, Math.round(confidence)));
}

