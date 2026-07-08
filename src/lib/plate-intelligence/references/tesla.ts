import { defineBrandKnowledge, reference } from './types';

export const TESLA_CODES = ['MODELS', 'MODEL3', 'MODELX', 'MODELY', 'S', '3', 'X', 'Y', 'PLAID'] as const;

export const TESLA_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Tesla',
  commonAbbreviations: ['TES'],
  popularModels: ['Model S', 'Model 3', 'Model X', 'Model Y'],
  performanceModels: ['Plaid', 'Performance'],
  knownNicknames: ['EV'],
  commonEngineModelReferences: ['EV', 'PLAID'],
  collectorNotes: 'Tesla Model S/3/X/Y ir Plaid žymėjimai aiškiai siejami su elektromobiliais.',
  references: [
    reference('TESLA', 'Tesla', 'BRAND', 90, 'Tesla markė aiškiai siejama su elektromobiliais ir Plaid versijomis.', ['TES'], ['MODELS', 'MODEL3', 'PLAID'], 'Tesla'),
    ...TESLA_CODES.map((code) =>
      reference(code, `Tesla ${code.startsWith('MODEL') ? code.replace('MODEL', 'Model ') : code}`, code === 'PLAID' ? 'PERFORMANCE' : 'MODEL', code === 'PLAID' ? 90 : 78, `${code} gali priminti Tesla ${code.startsWith('MODEL') ? code.replace('MODEL', 'Model ') : code} modelį arba versiją.`, [`TESLA${code}`, `TES${code}`], ['MODELS', 'MODEL3', 'MODELX', 'MODELY', 'PLAID'], 'Tesla'),
    ),
  ],
} as const);

