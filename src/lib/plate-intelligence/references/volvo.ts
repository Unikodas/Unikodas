import { defineBrandKnowledge, reference } from './types';

export const VOLVO_CODES = ['S60', 'S90', 'V60', 'V90', 'XC60', 'XC90', 'RDESIGN', 'POLESTAR'] as const;

export const VOLVO_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Volvo',
  commonAbbreviations: ['VOL'],
  popularModels: ['S60', 'S90', 'V60', 'V90', 'XC60', 'XC90'],
  performanceModels: ['R-Design', 'Polestar'],
  knownNicknames: [],
  commonEngineModelReferences: ['T5', 'T6', 'T8'],
  collectorNotes: 'Volvo R-Design, Polestar ir XC modeliai gali turėti aiškią markės asociaciją.',
  references: [
    reference('VOLVO', 'Volvo', 'BRAND', 86, 'Volvo markė dažnai siejama su skandinavišku premium įvaizdžiu.', ['VOL'], ['XC60', 'XC90', 'POLESTAR'], 'Volvo'),
    ...VOLVO_CODES.map((code) =>
      reference(code, `Volvo ${code === 'RDESIGN' ? 'R-Design' : code}`, code === 'RDESIGN' || code === 'POLESTAR' ? 'PERFORMANCE' : 'MODEL', 82, `${code} gali priminti Volvo ${code === 'RDESIGN' ? 'R-Design' : code} modelį arba versiją.`, [`VOL${code}`, `VOLVO${code}`], ['XC60', 'XC90', 'POLESTAR'], 'Volvo'),
    ),
  ],
} as const);

