import { defineBrandKnowledge, reference } from './types';

export const MITSUBISHI_CODES = ['EVO', 'EVOLUTION', 'LANCER'] as const;

export const MITSUBISHI_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Mitsubishi',
  commonAbbreviations: ['MIT', 'MITSU'],
  popularModels: ['Lancer', 'Evolution'],
  performanceModels: ['EVO', 'Evolution'],
  knownNicknames: ['Evo'],
  commonEngineModelReferences: ['4G63'],
  collectorNotes: 'Mitsubishi EVO ir 4G63 motyvai stipriai siejami su JDM ir ralio kultūra.',
  references: [
    reference('MITSUBISHI', 'Mitsubishi', 'BRAND', 84, 'Mitsubishi markė entuziastams dažnai siejasi su Lancer Evolution.', ['MIT', 'MITSU'], ['EVO', '4G63'], 'Mitsubishi'),
    ...MITSUBISHI_CODES.map((code) =>
      reference(code, `Mitsubishi ${code === 'EVO' ? 'EVO' : code}`, code === 'EVO' || code === 'EVOLUTION' ? 'PERFORMANCE' : 'MODEL', code === 'EVO' ? 96 : 86, `${code} gali priminti Mitsubishi Lancer Evolution.`, [`MITSU${code}`, `MIT${code}`], ['EVO', '4G63', 'JDM'], 'Mitsubishi'),
    ),
    reference('4G63', 'Mitsubishi 4G63', 'ENGINE', 90, '4G63 variklis yra gerai žinomas Mitsubishi EVO entuziastams.', [], ['EVO', 'LANCER'], 'Mitsubishi'),
  ],
} as const);

