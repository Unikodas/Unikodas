import { defineBrandKnowledge, reference } from './types';

export const SUBARU_CODES = ['WRX', 'STI', 'IMPREZA', 'BRZ'] as const;

export const SUBARU_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Subaru',
  commonAbbreviations: ['SUB'],
  popularModels: ['WRX', 'Impreza', 'BRZ'],
  performanceModels: ['WRX', 'STI'],
  knownNicknames: ['Scooby'],
  commonEngineModelReferences: ['555', 'EJ20', 'EJ25'],
  collectorNotes: 'Subaru WRX, STI ir 555 ralio motyvai labai atpažįstami tarp JDM ir ralio fanų.',
  references: [
    reference('SUBARU', 'Subaru', 'BRAND', 86, 'Subaru dažnai siejama su WRX, STI ir ralio kultūra.', ['SUB', 'SCOOBY'], ['WRX', 'STI555', 'IMPREZA'], 'Subaru'),
    ...SUBARU_CODES.map((code) =>
      reference(code, `Subaru ${code}`, code === 'WRX' || code === 'STI' ? 'PERFORMANCE' : 'MODEL', code === 'STI' ? 96 : 88, `${code} gali priminti Subaru ${code} modelį arba sportinį žymėjimą.`, [`SUB${code}`, `SUBARU${code}`], ['WRX', 'STI555', 'EJ20'], 'Subaru'),
    ),
    reference('555', 'Subaru 555', 'PERFORMANCE', 78, '555 gali priminti istorinę Subaru ralio spalvų ir rėmimo asociaciją.', ['STI555'], ['STI', 'WRX'], 'Subaru'),
    reference('EJ20', 'Subaru EJ20', 'ENGINE', 84, 'EJ20 yra Subaru bokserio variklio kodas, pažįstamas entuziastams.', [], ['WRX', 'STI'], 'Subaru'),
    reference('EJ25', 'Subaru EJ25', 'ENGINE', 82, 'EJ25 gali priminti Subaru bokserio variklį.', [], ['WRX', 'STI'], 'Subaru'),
  ],
} as const);

