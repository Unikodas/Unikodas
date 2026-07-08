import { normalizeKnowledgeText } from './normalization';
import type { KnowledgeBaseEntry, NormalizedKnowledgeEntry } from './schema';
import { generateKnowledgeVariants } from './variants';

export type KnowledgeMatchSource = 'exact' | 'alias' | 'prefix' | 'substring' | 'leet' | 'reverse';

export type KnowledgeMatch = {
  entry: NormalizedKnowledgeEntry;
  matchedText: string;
  source: KnowledgeMatchSource;
  confidence: number;
  reason: string;
  priority: number;
};

export type KnowledgeIndex = {
  entries: readonly NormalizedKnowledgeEntry[];
  exact: ReadonlyMap<string, readonly NormalizedKnowledgeEntry[]>;
  alias: ReadonlyMap<string, readonly NormalizedKnowledgeEntry[]>;
  prefix: ReadonlyMap<string, readonly NormalizedKnowledgeEntry[]>;
  substring: ReadonlyMap<string, readonly NormalizedKnowledgeEntry[]>;
  reverse: ReadonlyMap<string, readonly NormalizedKnowledgeEntry[]>;
  byCategory: ReadonlyMap<string, readonly NormalizedKnowledgeEntry[]>;
};

type SearchFragment = {
  value: string;
  start: number;
  end: number;
  startsAtBoundary: boolean;
  endsAtBoundary: boolean;
};

export function normalizeEntries(entries: readonly KnowledgeBaseEntry[]): NormalizedKnowledgeEntry[] {
  const seen = new Set<string>();
  const normalized: NormalizedKnowledgeEntry[] = [];

  for (const entry of entries) {
    const normalizedKeyword = normalizeKnowledgeText(entry.keyword);
    if (!normalizedKeyword) continue;
    const id = `${entry.category}:${entry.subcategory}:${normalizedKeyword}:${normalizeKnowledgeText(entry.displayName)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      ...entry,
      id,
      normalizedKeyword,
      normalizedDisplayName: normalizeKnowledgeText(entry.displayName),
      normalizedAliases: entry.aliases.map(normalizeKnowledgeText).filter(Boolean),
    });
  }

  return normalized;
}

export function buildKnowledgeIndex(entries: readonly KnowledgeBaseEntry[]): KnowledgeIndex {
  const normalized = normalizeEntries(entries);
  const exact = new Map<string, NormalizedKnowledgeEntry[]>();
  const alias = new Map<string, NormalizedKnowledgeEntry[]>();
  const prefix = new Map<string, NormalizedKnowledgeEntry[]>();
  const substring = new Map<string, NormalizedKnowledgeEntry[]>();
  const reverse = new Map<string, NormalizedKnowledgeEntry[]>();
  const byCategory = new Map<string, NormalizedKnowledgeEntry[]>();

  for (const entry of normalized) {
    addToMap(exact, entry.normalizedKeyword, entry);
    addToMap(exact, entry.normalizedDisplayName, entry);
    addToMap(byCategory, entry.category, entry);

    for (const item of [entry.normalizedKeyword, entry.normalizedDisplayName, ...entry.normalizedAliases]) {
      if (!item) continue;
      addToMap(alias, item, entry);
      addToMap(reverse, reverseText(item), entry);
      if (item.length >= 3) {
        for (let length = 3; length <= Math.min(item.length, 8); length += 1) {
          addToMap(prefix, item.slice(0, length), entry);
        }
        addToMap(substring, item, entry);
      }
    }
  }

  return {
    entries: normalized,
    exact: freezeMap(exact),
    alias: freezeMap(alias),
    prefix: freezeMap(prefix),
    substring: freezeMap(substring),
    reverse: freezeMap(reverse),
    byCategory: freezeMap(byCategory),
  };
}

export function searchKnowledgeIndex(index: KnowledgeIndex, rawInput: string): KnowledgeMatch[] {
  const normalized = normalizeKnowledgeText(rawInput);
  if (!normalized) return [];

  const matches = new Map<string, KnowledgeMatch>();
  const add = (
    entry: NormalizedKnowledgeEntry,
    matchedText: string,
    source: KnowledgeMatchSource,
    baseConfidence: number,
    reason: string,
  ) => {
    const confidence = Math.min(entry.confidence, baseConfidence);
    const priority = getPriority(entry, source, confidence);
    const key = `${entry.id}:${source}:${matchedText}`;
    const existing = matches.get(entry.id);
    const candidate = { entry, matchedText, source, confidence, reason, priority };
    if (!existing || candidate.confidence > existing.confidence || candidate.priority > existing.priority) {
      matches.set(entry.id, candidate);
    } else if (!matches.has(key)) {
      matches.set(key, candidate);
    }
  };

  for (const variant of generateKnowledgeVariants(rawInput)) {
    const exactEntries = index.exact.get(variant.value) ?? [];
    for (const entry of exactEntries) {
      add(entry, variant.value, variant.source === 'leet' ? 'leet' : 'exact', variant.source === 'leet' ? 92 : 99, variant.reason);
    }

    const aliasEntries = index.alias.get(variant.value) ?? [];
    for (const entry of aliasEntries) {
      add(entry, variant.value, variant.source === 'leet' ? 'leet' : 'alias', variant.source === 'leet' ? 90 : 94, variant.reason);
    }

    if (variant.value.length >= 3) {
      const prefixEntries = index.prefix.get(variant.value) ?? [];
      for (const entry of prefixEntries.slice(0, 20)) {
        if (entry.normalizedKeyword === variant.value || entry.normalizedDisplayName === variant.value) continue;
        if (isModelLikeEntry(entry)) continue;
        add(entry, variant.value, 'prefix', 78, `"${variant.value}" yra zinomos reiksmes "${entry.displayName}" pradzia.`);
      }

      for (const fragment of getSearchFragments(variant.value)) {
        const fragmentEntries = index.substring.get(fragment.value) ?? [];
        for (const entry of fragmentEntries.slice(0, 20)) {
          if (fragment.value === variant.value && entry.normalizedKeyword !== fragment.value) continue;
          if (!shouldUseSubstringMatch(entry, fragment, variant.value)) continue;
          add(
            entry,
            fragment.value,
            'substring',
            82,
            `Derinyje matomas fragmentas "${fragment.value}", kuris gali priminti "${entry.displayName}".`,
          );
        }
      }
    }

    const reversed = reverseText(variant.value);
    const reverseEntries = index.reverse.get(reversed) ?? [];
    for (const entry of reverseEntries) {
      add(entry, variant.value, 'reverse', 72, `Derinys gali buti pastebimas skaitant atvirksciai kaip "${entry.displayName}".`);
    }
  }

  return [...matches.values()]
    .sort((a, b) => b.confidence - a.confidence || b.priority - a.priority)
    .slice(0, 30);
}

function shouldUseSubstringMatch(entry: NormalizedKnowledgeEntry, fragment: SearchFragment, sourceValue: string): boolean {
  if (fragment.value === sourceValue) return true;
  if (fragment.value.length <= 3) {
    return isAutomotiveEntry(entry) && fragment.startsAtBoundary;
  }
  if (fragment.value.length < 5 && !fragment.startsAtBoundary && !fragment.endsAtBoundary) return false;
  return true;
}

function isAutomotiveEntry(entry: NormalizedKnowledgeEntry): boolean {
  return ['cars', 'supercars', 'manufacturers', 'engines', 'gearboxes', 'performance', 'motorcycles', 'motorsport', 'trucks'].includes(entry.category);
}

function isModelLikeEntry(entry: NormalizedKnowledgeEntry): boolean {
  return ['cars', 'supercars', 'motorcycles', 'trucks'].includes(entry.category);
}

function getPriority(entry: NormalizedKnowledgeEntry, source: KnowledgeMatchSource, confidence: number): number {
  const categoryBoost = ['cars', 'supercars', 'manufacturers', 'engines', 'gearboxes', 'performance', 'motorcycles', 'motorsport', 'trucks'].includes(entry.category)
    ? 24
    : ['lithuanian-names', 'english-names', 'cities', 'countries'].includes(entry.category)
      ? 16
      : 8;
  const sourceBoost = source === 'exact' || source === 'alias' ? 18 : source === 'leet' ? 12 : source === 'prefix' ? 6 : 2;
  return Math.round(confidence + categoryBoost + sourceBoost);
}

function getSearchFragments(value: string): SearchFragment[] {
  const fragments = new Map<string, SearchFragment>();
  for (let start = 0; start < value.length; start += 1) {
    for (let length = 3; length <= Math.min(8, value.length - start); length += 1) {
      const end = start + length;
      const fragment = value.slice(start, end);
      if (fragments.has(fragment)) continue;
      fragments.set(fragment, {
        value: fragment,
        start,
        end,
        startsAtBoundary: start === 0 || isCharacterBoundary(value[start - 1], value[start]),
        endsAtBoundary: end === value.length || isCharacterBoundary(value[end - 1], value[end]),
      });
    }
  }
  return [...fragments.values()];
}

function isCharacterBoundary(left: string, right: string): boolean {
  return /\d/.test(left) !== /\d/.test(right);
}

function reverseText(value: string): string {
  return value.split('').reverse().join('');
}

function addToMap(map: Map<string, NormalizedKnowledgeEntry[]>, key: string, entry: NormalizedKnowledgeEntry): void {
  if (!key) return;
  const current = map.get(key);
  if (current) current.push(entry);
  else map.set(key, [entry]);
}

function freezeMap(map: Map<string, NormalizedKnowledgeEntry[]>): ReadonlyMap<string, readonly NormalizedKnowledgeEntry[]> {
  const frozen = new Map<string, readonly NormalizedKnowledgeEntry[]>();
  for (const [key, value] of map) {
    frozen.set(key, Object.freeze([...value]));
  }
  return frozen;
}
