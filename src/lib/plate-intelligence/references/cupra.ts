import { defineBrandKnowledge, reference } from './types';

export const CUPRA_CODES = ['CUPRA', 'LEON', 'FORMENTOR', 'ATECA', 'BORN', 'VZ', 'VZ5'] as const;

export const CUPRA_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Cupra',
  commonAbbreviations: ['CUP'],
  popularModels: ['Leon', 'Formentor', 'Ateca', 'Born'],
  performanceModels: ['VZ', 'VZ5'],
  knownNicknames: [],
  commonEngineModelReferences: ['VZ', 'VZ5'],
  collectorNotes: 'Cupra VZ ir VZ5 motyvai aiškiai siejami su sportiška VAG grupės kryptimi.',
  references: [
    reference('CUPRA', 'Cupra', 'BRAND', 86, 'Cupra markė dažnai siejama su sportiškais VAG modeliais.', ['CUP'], ['FORMENTOR', 'VZ5', 'LEON'], 'Cupra'),
    ...CUPRA_CODES.filter((code) => code !== 'CUPRA').map((code) =>
      reference(code, `Cupra ${code}`, code === 'VZ' || code === 'VZ5' ? 'PERFORMANCE' : 'MODEL', 82, `${code} gali priminti Cupra ${code} modelį arba versiją.`, [`CUPRA${code}`, `CUP${code}`], ['FORMENTOR', 'VZ5', 'LEON'], 'Cupra'),
    ),
  ],
} as const);

