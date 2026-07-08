import { defineBrandKnowledge, reference } from './types';

export const PORSCHE_CODES = ['911', '718', '918', '992', '991', '997', '996', 'GT2', 'GT3', 'GT4', 'TURBO', 'CARRERA', 'TARGA', 'RS'] as const;

export const PORSCHE_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Porsche',
  commonAbbreviations: ['POR', 'PORS', 'PORSCH'],
  popularModels: ['911', '718', '918', 'Carrera', 'Targa'],
  performanceModels: ['GT2', 'GT3', 'GT4', 'Turbo', 'RS'],
  knownNicknames: ['Porka'],
  commonEngineModelReferences: ['911', '718', '918', '992', '991', '997', '996'],
  collectorNotes: 'Porsche 911, GT ir RS kodai dažnai turi stiprią kolekcinę asociaciją.',
  references: [
    reference('PORSCHE', 'Porsche', 'BRAND', 96, 'Porsche markė turi stiprią sportinių ir kolekcinių automobilių asociaciją.', ['POR', 'PORS', 'PORSCH'], ['911', 'GT3', 'GT2', '992'], 'Porsche'),
    ...PORSCHE_CODES.map((code) =>
      reference(
        code,
        `Porsche ${code}`,
        ['GT2', 'GT3', 'GT4', 'TURBO', 'RS'].includes(code) ? 'PERFORMANCE' : 'MODEL',
        ['911', 'GT2', 'GT3', 'GT4'].includes(code) ? 96 : 88,
        `${code} dažnai siejama su Porsche ${code} modeliu arba versija.`,
        [`POR${code}`, `PORS${code}`, `PORSCHE${code}`],
        ['911', '992', 'GT3', 'GT2', 'TARGA'],
        'Porsche',
      ),
    ),
  ],
} as const);

