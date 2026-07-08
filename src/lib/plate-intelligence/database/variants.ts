import { LEET_SUBSTITUTIONS } from '@/lib/plate-intelligence/leet';
import { collapseRepeatedCharacters, normalizeKnowledgeText, normalizeRomanNumerals } from './normalization';

export type KnowledgeVariant = {
  value: string;
  source: 'original' | 'roman' | 'leet' | 'collapsed' | 'separated' | 'alias';
  reason: string;
};

const MAX_VARIANTS = 256;

export function generateKnowledgeVariants(input: string): KnowledgeVariant[] {
  const normalized = normalizeKnowledgeText(input);
  if (!normalized) return [];

  const variants = new Map<string, KnowledgeVariant>();
  const add = (value: string, source: KnowledgeVariant['source'], reason: string) => {
    const clean = normalizeKnowledgeText(value);
    if (!clean || variants.has(clean) || variants.size >= MAX_VARIANTS) return;
    variants.set(clean, { value: clean, source, reason });
  };

  add(normalized, 'original', 'Originaliai normalizuotas derinys.');
  add(normalizeRomanNumerals(input), 'roman', 'Romanu skaitmenys paversti i arabiskus skaicius.');
  add(collapseRepeatedCharacters(normalized), 'collapsed', 'Sutrumpintos ilgos pasikartojanciu simboliu sekos.');

  const digitPositions = [...normalized].flatMap((char, index) =>
    LEET_SUBSTITUTIONS[char as keyof typeof LEET_SUBSTITUTIONS]?.map((letter) => ({ index, letter })) ?? [],
  );
  const bounded = digitPositions.slice(0, 8);
  const total = Math.min(1 << bounded.length, MAX_VARIANTS);
  for (let mask = 1; mask < total; mask += 1) {
    const chars = normalized.split('');
    const substitutions: string[] = [];
    for (let i = 0; i < bounded.length; i += 1) {
      if ((mask & (1 << i)) === 0) continue;
      const item = bounded[i];
      substitutions.push(`${chars[item.index]}->${item.letter}`);
      chars[item.index] = item.letter;
    }
    const leetValue = chars.join('');
    add(leetValue, 'leet', `Vizualus skaiciu skaitymas: ${substitutions.join(', ')}.`);
    add(collapseRepeatedLetters(leetValue), 'collapsed', `Vizualus skaitymas su sutrumpinta pasikartojanciu raidziu seka: ${substitutions.join(', ')}.`);
  }

  const withSeparator = normalized.replace(/([A-Z]+)(\d+)/g, '$1-$2').replace(/(\d+)([A-Z]+)/g, '$1-$2');
  add(withSeparator, 'separated', 'Raidziu ir skaiciu grupes atskirtos kaip naturalus zodziai.');

  return [...variants.values()];
}

function collapseRepeatedLetters(value: string): string {
  return value.replace(/([A-Z])\1+/g, '$1');
}

