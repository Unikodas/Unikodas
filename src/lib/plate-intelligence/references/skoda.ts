import { defineBrandKnowledge, reference } from './types';

export const SKODA_CODES = ['OCTAVIA', 'SUPERB', 'FABIA', 'VRS', 'RS', 'KODIAQ'] as const;

export const SKODA_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Skoda',
  commonAbbreviations: ['SKO'],
  popularModels: ['Octavia', 'Superb', 'Fabia', 'Kodiaq'],
  performanceModels: ['vRS', 'RS'],
  knownNicknames: [],
  commonEngineModelReferences: ['VRS', 'RS'],
  collectorNotes: 'Skoda vRS ir Octavia/Superb motyvai pažįstami VAG bendruomenei.',
  references: [
    reference('SKODA', 'Skoda', 'BRAND', 82, 'Skoda gali sietis su VAG grupe ir vRS modeliais.', ['SKO'], ['OCTAVIA', 'VRS', 'SUPERB'], 'Skoda'),
    ...SKODA_CODES.map((code) =>
      reference(code, `Skoda ${code === 'VRS' ? 'vRS' : code}`, code === 'VRS' || code === 'RS' ? 'PERFORMANCE' : 'MODEL', 80, `${code} gali priminti Skoda ${code === 'VRS' ? 'vRS' : code} modelį arba versiją.`, [`SKODA${code}`, `SKO${code}`], ['OCTAVIA', 'VRS', 'SUPERB'], 'Skoda'),
    ),
  ],
} as const);

