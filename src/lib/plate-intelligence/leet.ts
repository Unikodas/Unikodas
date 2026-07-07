export const LEET_SUBSTITUTIONS: Record<string, readonly string[]> = {
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

export const REVERSE_LEET_SUBSTITUTIONS: Record<string, readonly string[]> = {
  A: ['4'],
  B: ['8'],
  E: ['3'],
  G: ['6', '9'],
  I: ['1'],
  L: ['1'],
  O: ['0'],
  P: ['9'],
  S: ['5'],
  T: ['7'],
  Z: ['2'],
};

export function describeLeetSubstitution(digit: string, letter: string): string {
  return `Skaičius ${digit} gali priminti raidę ${letter}`;
}
