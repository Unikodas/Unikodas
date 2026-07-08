import { buildRelationshipGraph } from './graph';
import { buildKnowledgeIndex } from './indexes';
import type { KnowledgeBaseEntry, KnowledgeCategoryPack } from './schema';

export type KnowledgeBase = {
  entries: readonly KnowledgeBaseEntry[];
  index: ReturnType<typeof buildKnowledgeIndex>;
  graph: ReturnType<typeof buildRelationshipGraph>;
  countsByCategory: Readonly<Record<string, number>>;
  totalReferences: number;
};

export function loadKnowledgeBase(packs: readonly KnowledgeCategoryPack[]): KnowledgeBase {
  const entries = packs.flatMap((pack) => pack.entries);
  const index = buildKnowledgeIndex(entries);
  const graph = buildRelationshipGraph(index.entries);
  const countsByCategory = index.entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.category] = (counts[entry.category] ?? 0) + 1;
    return counts;
  }, {});

  return {
    entries,
    index,
    graph,
    countsByCategory,
    totalReferences: index.entries.length,
  };
}

