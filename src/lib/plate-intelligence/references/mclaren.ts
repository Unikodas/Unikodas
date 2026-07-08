import { defineBrandKnowledge, reference } from './types';

export const MCLAREN_CODES = ['570S', '600LT', '720S', '750S', '765LT', 'P1'] as const;

export const MCLAREN_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'McLaren',
  commonAbbreviations: ['MCL', 'MCLRN'],
  popularModels: ['570S', '600LT', '720S', '750S', '765LT', 'P1'],
  performanceModels: ['600LT', '765LT', 'P1'],
  knownNicknames: [],
  commonEngineModelReferences: ['LT', 'P1'],
  collectorNotes: 'McLaren LT ir P1 žymėjimai dažnai turi aiškią superautomobilio asociaciją.',
  references: [
    reference('MCLAREN', 'McLaren', 'BRAND', 94, 'McLaren markė siejama su britiškais superautomobiliais.', ['MCL', 'MCLRN'], ['720S', '765LT', 'P1'], 'McLaren'),
    ...MCLAREN_CODES.map((code) =>
      reference(code, `McLaren ${code}`, 'SUPERCAR', ['P1', '765LT'].includes(code) ? 97 : 92, `${code} gali priminti McLaren ${code} superautomobilį.`, [`MCL${code}`, `MCLAREN${code}`], ['720S', '765LT', 'P1'], 'McLaren'),
    ),
  ],
} as const);

