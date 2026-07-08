const LITHUANIAN_LETTERS: Record<string, string> = {
  Ą: 'A',
  Č: 'C',
  Ę: 'E',
  Ė: 'E',
  Į: 'I',
  Š: 'S',
  Ų: 'U',
  Ū: 'U',
  Ž: 'Z',
};

const ROMAN_NUMERALS: Record<string, string> = {
  I: '1',
  II: '2',
  III: '3',
  IV: '4',
  V: '5',
  VI: '6',
  VII: '7',
  VIII: '8',
  IX: '9',
  X: '10',
  XI: '11',
  XII: '12',
};

export function normalizeKnowledgeText(value: string): string {
  return value
    .normalize('NFKD')
    .toUpperCase()
    .replace(/[ĄČĘĖĮŠŲŪŽ]/g, (letter) => LITHUANIAN_LETTERS[letter] ?? letter)
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'AND')
    .replace(/\+/g, 'PLUS')
    .replace(/[^A-Z0-9]/g, '');
}

export function normalizeLooseText(value: string): string {
  return value
    .normalize('NFKD')
    .toUpperCase()
    .replace(/[ĄČĘĖĮŠŲŪŽ]/g, (letter) => LITHUANIAN_LETTERS[letter] ?? letter)
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, ' ')
    .trim();
}

export function collapseRepeatedCharacters(value: string): string {
  return value.replace(/([A-Z0-9])\1{2,}/g, '$1$1');
}

export function normalizeRomanNumerals(value: string): string {
  return value.replace(/\b(?:XII|XI|VIII|VII|VI|IV|III|II|IX|X|V|I)\b/gi, (match) => ROMAN_NUMERALS[match.toUpperCase()] ?? match);
}

export function getRomanNumeralValue(value: string): string | null {
  return ROMAN_NUMERALS[value.toUpperCase()] ?? null;
}

