import { defineBrandKnowledge, reference } from './types';

export const HYUNDAI_CODES = ['I20N', 'I30N', 'N', 'VELOSTER', 'KONA'] as const;

export const HYUNDAI_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Hyundai',
  commonAbbreviations: ['HYU', 'HYUN'],
  popularModels: ['i20 N', 'i30 N', 'Veloster', 'Kona'],
  performanceModels: ['N', 'i20 N', 'i30 N', 'Veloster N'],
  knownNicknames: ['N'],
  commonEngineModelReferences: ['N', 'I20N', 'I30N'],
  collectorNotes: 'Hyundai N modeliai vis dažniau atpažįstami sportinių hečbekų entuziastų.',
  references: [
    reference('HYUNDAI', 'Hyundai', 'BRAND', 80, 'Hyundai gali sietis su N sportinių modelių linija.', ['HYU', 'HYUN'], ['I30N', 'I20N'], 'Hyundai'),
    ...HYUNDAI_CODES.map((code) =>
      reference(code, `Hyundai ${code}`, code.includes('N') ? 'PERFORMANCE' : 'MODEL', code.includes('N') ? 84 : 76, `${code} gali priminti Hyundai ${code} modelį arba N versiją.`, [`HYU${code}`, `HYUNDAI${code}`], ['I30N', 'I20N'], 'Hyundai'),
    ),
  ],
} as const);

