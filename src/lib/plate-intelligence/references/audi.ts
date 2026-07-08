import { defineBrandKnowledge, reference } from './types';

export const AUDI_CODES = ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'TT', 'R8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8'] as const;

export const AUDI_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Audi',
  commonAbbreviations: ['AUD', 'AUDI'],
  popularModels: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'TT', 'R8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8'],
  performanceModels: ['S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'R8'],
  knownNicknames: ['Quattro'],
  commonEngineModelReferences: AUDI_CODES,
  collectorNotes: 'Audi S, RS, R8 ir Quattro motyvai dažnai patrauklūs VAG ir sportinių Audi entuziastams.',
  references: [
    reference('AUDI', 'Audi', 'BRAND', 97, 'Audi markė lengvai atpažįstama, ypač su S, RS ar Quattro motyvais.', ['AUD'], ['RS3', 'RS4', 'RS5', 'RS6'], 'Audi'),
    reference('QUATTRO', 'Audi Quattro', 'PERFORMANCE', 90, 'Quattro yra labai atpažįstamas Audi visų varančiųjų ratų ir ralio istorijos motyvas.', ['QTR'], ['S6', 'RS6', 'R8'], 'Audi'),
    ...AUDI_CODES.map((code) =>
      reference(
        code,
        `Audi ${code}`,
        code.startsWith('RS') || code.startsWith('S') || code === 'R8' ? 'PERFORMANCE' : 'MODEL',
        code.startsWith('RS') || code === 'R8' ? 96 : code.startsWith('S') ? 90 : 84,
        `${code} gali priminti Audi ${code} modelį${code.startsWith('RS') ? ' ir sportinę RS liniją' : ''}.`,
        [`AUDI${code}`, `AUD${code}`],
        code.startsWith('RS') ? ['RS3', 'RS4', 'RS5', 'RS6', 'S6'] : ['A6', 'S6', 'RS6', 'Q7'],
        'Audi',
      ),
    ),
  ],
} as const);

