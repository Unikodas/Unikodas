import { defineBrandKnowledge, reference } from './types';

export const SEAT_CODES = ['LEON', 'IBIZA', 'CUPRA', 'FR'] as const;

export const SEAT_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Seat',
  commonAbbreviations: ['SEAT'],
  popularModels: ['Leon', 'Ibiza'],
  performanceModels: ['Cupra', 'FR'],
  knownNicknames: [],
  commonEngineModelReferences: ['FR', 'CUPRA'],
  collectorNotes: 'Seat Leon Cupra ir FR žymėjimai gerai pažįstami VAG entuziastams.',
  references: [
    reference('SEAT', 'Seat', 'BRAND', 80, 'Seat gali priminti VAG grupės Leon, Ibiza, Cupra ir FR modelius.', [], ['LEON', 'CUPRA', 'FR'], 'Seat'),
    ...SEAT_CODES.map((code) =>
      reference(code, `Seat ${code}`, code === 'CUPRA' || code === 'FR' ? 'PERFORMANCE' : 'MODEL', 80, `${code} gali priminti Seat ${code} modelį arba versiją.`, [`SEAT${code}`], ['LEON', 'CUPRA', 'FR'], 'Seat'),
    ),
  ],
} as const);

