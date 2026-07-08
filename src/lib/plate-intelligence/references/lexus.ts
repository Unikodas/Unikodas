import { defineBrandKnowledge, reference } from './types';

export const LEXUS_CODES = ['IS', 'GS', 'LS', 'RC', 'LC', 'LFA', 'FSPORT'] as const;

export const LEXUS_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Lexus',
  commonAbbreviations: ['LEX'],
  popularModels: ['IS', 'GS', 'LS', 'RC', 'LC', 'LFA'],
  performanceModels: ['LFA', 'F Sport', 'RC F', 'IS F'],
  knownNicknames: [],
  commonEngineModelReferences: ['LFA', 'FSPORT'],
  collectorNotes: 'Lexus LFA, F Sport, RC ir LC motyvai gali būti įdomūs premium/JDM gerbėjams.',
  references: [
    reference('LEXUS', 'Lexus', 'BRAND', 86, 'Lexus markė siejama su premium Toyota grupės automobiliais.', ['LEX'], ['LFA', 'LC', 'RCF'], 'Lexus'),
    ...LEXUS_CODES.map((code) =>
      reference(code, `Lexus ${code === 'FSPORT' ? 'F Sport' : code}`, code === 'LFA' || code === 'FSPORT' ? 'PERFORMANCE' : 'MODEL', code === 'LFA' ? 95 : 82, `${code} gali priminti Lexus ${code === 'FSPORT' ? 'F Sport' : code} modelį arba versiją.`, [`LEX${code}`, `LEXUS${code}`], ['LFA', 'LC', 'RCF'], 'Lexus'),
    ),
  ],
} as const);

