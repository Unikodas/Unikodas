import { defineBrandKnowledge, reference } from './types';

export const VOLKSWAGEN_CODES = ['GOLF', 'GOLFR', 'GTI', 'GTD', 'PASSAT', 'ARTEON', 'SCIROCCO', 'R32', 'R36'] as const;

export const VOLKSWAGEN_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Volkswagen',
  commonAbbreviations: ['VW', 'VAG'],
  popularModels: ['Golf', 'Passat', 'Arteon', 'Scirocco'],
  performanceModels: ['Golf R', 'GTI', 'GTD', 'R32', 'R36'],
  knownNicknames: ['VAG'],
  commonEngineModelReferences: ['R32', 'R36', 'GTI', 'GTD'],
  collectorNotes: 'Volkswagen GTI, R32, R36 ir Golf R žymėjimai labai pažįstami Lietuvos VAG bendruomenei.',
  references: [
    reference('VW', 'Volkswagen', 'BRAND', 90, 'VW trumpinys aiškiai siejamas su Volkswagen.', ['VAG', 'VOLKSWAGEN'], ['GTI', 'R32', 'R36', 'GOLF'], 'Volkswagen'),
    reference('VAG', 'VAG grupė', 'BRAND', 88, 'VAG dažnai vartojamas Audi, Volkswagen, Skoda, Seat ir Cupra entuziastų aplinkoje.', ['VWGROUP'], ['GTI', 'RS6', 'CUPRA'], 'Volkswagen'),
    ...VOLKSWAGEN_CODES.map((code) =>
      reference(code, `Volkswagen ${code === 'GOLFR' ? 'Golf R' : code}`, code === 'GTI' || code === 'GTD' || code.startsWith('R') || code === 'GOLFR' ? 'PERFORMANCE' : 'MODEL', 86, `${code} gali priminti Volkswagen ${code === 'GOLFR' ? 'Golf R' : code} motyvą.`, [`VW${code}`], ['GTI', 'R32', 'R36', 'GOLFR'], 'Volkswagen'),
    ),
  ],
} as const);

