import { KNOWLEDGE_CATEGORY_PACKS } from './category-packs';
import { loadKnowledgeBase } from './loaders';

export type { KnowledgeBase } from './loaders';
export type {
  KnowledgeBaseEntry,
  KnowledgeCategory,
  KnowledgeCategoryPack,
  KnowledgeLanguage,
  NormalizedKnowledgeEntry,
} from './schema';

export { buildKnowledgeIndex, searchKnowledgeIndex, type KnowledgeMatch, type KnowledgeMatchSource } from './indexes';
export { buildRelationshipGraph, type KnowledgeRelationshipGraph } from './graph';
export { parseKnowledgeJsonEntries } from './json-loader';
export { normalizeKnowledgeText, normalizeLooseText, normalizeRomanNumerals } from './normalization';
export { generateKnowledgeVariants, type KnowledgeVariant } from './variants';

export const KNOWLEDGE_BASE = loadKnowledgeBase(KNOWLEDGE_CATEGORY_PACKS);
export const KNOWLEDGE_BASE_TOTAL_REFERENCES = KNOWLEDGE_BASE.totalReferences;
export const KNOWLEDGE_BASE_CATEGORY_COUNTS = KNOWLEDGE_BASE.countsByCategory;

