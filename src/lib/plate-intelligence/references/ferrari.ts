import { defineBrandKnowledge, reference } from './types';

export const FERRARI_CODES = ['488', '458', '430', '360', '812', 'F12', 'SF90', 'F40', 'F50', 'ENZO'] as const;

export const FERRARI_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Ferrari',
  commonAbbreviations: ['FER', 'FERR'],
  popularModels: ['488', '458', '430', '360', '812', 'F12', 'SF90'],
  performanceModels: ['F40', 'F50', 'Enzo', 'SF90'],
  knownNicknames: ['Prancing Horse'],
  commonEngineModelReferences: ['V8', 'V12'],
  collectorNotes: 'Ferrari skaičių ir modelių kodai dažnai turi stiprią superautomobilio asociaciją.',
  references: [
    reference('FERRARI', 'Ferrari', 'BRAND', 96, 'Ferrari markė turi labai stiprią superautomobilių ir kolekcinių automobilių asociaciją.', ['FER', 'FERR'], ['FER488', 'F12', 'SF90'], 'Ferrari'),
    ...FERRARI_CODES.map((code) =>
      reference(code, `Ferrari ${code}`, 'SUPERCAR', ['F40', 'F50', 'ENZO', 'SF90'].includes(code) ? 97 : 94, `${code} gali priminti Ferrari ${code} modelį.`, [`FER${code}`, `FERRARI${code}`], ['FER488', 'FER458', 'F12', 'SF90'], 'Ferrari'),
    ),
  ],
} as const);

