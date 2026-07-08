import { defineBrandKnowledge, reference } from './types';

export const BUGATTI_CODES = ['CHIRON', 'VEYRON', 'W16'] as const;

export const BUGATTI_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Bugatti',
  commonAbbreviations: ['BUG'],
  popularModels: ['Chiron', 'Veyron'],
  performanceModels: ['Chiron', 'Veyron', 'W16'],
  knownNicknames: [],
  commonEngineModelReferences: ['W16'],
  collectorNotes: 'Bugatti Chiron ir Veyron yra itin atpažįstami hypercar motyvai.',
  references: [
    reference('BUGATTI', 'Bugatti', 'BRAND', 94, 'Bugatti markė siejama su hypercar segmentu ir itin retais automobiliais.', ['BUG'], ['CHIRON', 'VEYRON', 'W16'], 'Bugatti'),
    ...BUGATTI_CODES.map((code) =>
      reference(code, `Bugatti ${code}`, 'SUPERCAR', code === 'W16' ? 90 : 96, `${code} gali priminti Bugatti ${code} modelį arba W16 variklį.`, [`BUG${code}`, `BUGATTI${code}`], ['CHIRON', 'VEYRON', 'W16'], 'Bugatti'),
    ),
  ],
} as const);

