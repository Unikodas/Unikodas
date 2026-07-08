import { normalizeKnowledgeText } from './normalization';
import type { NormalizedKnowledgeEntry } from './schema';

export type KnowledgeRelationshipGraph = ReadonlyMap<string, readonly string[]>;

export function buildRelationshipGraph(entries: readonly NormalizedKnowledgeEntry[]): KnowledgeRelationshipGraph {
  const graph = new Map<string, string[]>();
  const known = new Set(entries.map((entry) => entry.normalizedKeyword));

  for (const entry of entries) {
    const related = new Set<string>();
    for (const keyword of entry.relatedKeywords) {
      const normalized = normalizeKnowledgeText(keyword);
      if (normalized) related.add(normalized);
    }
    for (const tag of entry.tags) {
      const normalized = normalizeKnowledgeText(tag);
      if (normalized && known.has(normalized)) related.add(normalized);
    }
    graph.set(entry.normalizedKeyword, [...related]);
  }

  return graph;
}

