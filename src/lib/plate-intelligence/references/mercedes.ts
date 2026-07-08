import { defineBrandKnowledge, reference } from './types';

export const MERCEDES_MODEL_NUMBERS = [
  '180',
  '200',
  '220',
  '230',
  '240',
  '250',
  '280',
  '300',
  '320',
  '350',
  '400',
  '430',
  '450',
  '500',
  '550',
  '560',
  '580',
  '600',
] as const;

export const MERCEDES_CLASSES = ['A', 'B', 'C', 'CLA', 'CLS', 'E', 'S', 'G', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS'] as const;
export const MERCEDES_AMG_MODELS = ['A35', 'A45', 'C43', 'C63', 'E53', 'E55', 'E63', 'S63', 'S65', 'G63', 'G65', 'CLA45', 'CLS63'] as const;
export const AMG_NUMBERS = ['43', '53', '63', '65'] as const;

const mercedesRelated = ['AMG063', 'S063', 'G063', 'C63', 'E63'];

export const MERCEDES_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Mercedes-Benz',
  commonAbbreviations: ['MB', 'MERC', 'BENZ', 'MERCEDES'],
  popularModels: [...MERCEDES_CLASSES, ...MERCEDES_MODEL_NUMBERS],
  performanceModels: ['AMG', ...MERCEDES_AMG_MODELS, 'Brabus'],
  knownNicknames: ['Merc', 'Benz'],
  commonEngineModelReferences: MERCEDES_MODEL_NUMBERS,
  collectorNotes: 'Mercedes-Benz ir AMG žymėjimai dažnai atpažįstami pagal klases, skaičius ir trumpinius.',
  references: [
    reference('MERCEDES', 'Mercedes-Benz', 'BRAND', 96, 'Mercedes-Benz markė turi stiprią premium ir AMG asociaciją.', ['MB', 'MERC', 'BENZ'], mercedesRelated, 'Mercedes-Benz'),
    reference('AMG', 'Mercedes-AMG', 'PERFORMANCE', 99, 'AMG yra viena atpažįstamiausių Mercedes sportinių linijų.', ['MERCAMG', 'BENZAMG'], mercedesRelated, 'Mercedes-Benz'),
    reference('BRABUS', 'Brabus', 'PERFORMANCE', 94, 'Brabus dažnai siejama su aukštos klasės Mercedes tiuningu.', ['BRAB'], ['G63', 'S63', 'AMG063'], 'Mercedes-Benz'),
    ...MERCEDES_MODEL_NUMBERS.map((model) =>
      reference(
        `MB${model}`,
        `Mercedes ${model}`,
        'MODEL',
        90,
        `Mercedes ${model} gali priminti Mercedes modelio arba variklio žymėjimą.`,
        [`MERC${model}`, `BENZ${model}`, `MERCEDES${model}`],
        mercedesRelated,
        'Mercedes-Benz',
      ),
    ),
    ...MERCEDES_CLASSES.map((klass) =>
      reference(klass, `Mercedes ${klass} klasė`, 'SERIES', klass.length === 1 ? 54 : 70, `${klass} gali priminti Mercedes klasės žymėjimą.`, [`MB${klass}`, `MERC${klass}`], mercedesRelated, 'Mercedes-Benz'),
    ),
    ...MERCEDES_AMG_MODELS.map((model) =>
      reference(
        model,
        `Mercedes-AMG ${model}`,
        'PERFORMANCE',
        94,
        `${model} dažnai siejama su Mercedes-AMG sportiniu modeliu.`,
        [`AMG${model}`, `MB${model}`, `MERC${model}`],
        mercedesRelated,
        'Mercedes-Benz',
      ),
    ),
    ...AMG_NUMBERS.map((number) =>
      reference(
        `AMG0${number}`,
        `Mercedes-AMG ${number}`,
        'PERFORMANCE',
        88,
        `0${number} gali būti stilizuotas AMG ${number} motyvas, ypač kai šalia yra AMG arba Mercedes klasės raidės.`,
        [`AMG${number}`, `S${number}`, `G${number}`, `C${number}`, `E${number}`],
        mercedesRelated,
        'Mercedes-Benz',
      ),
    ),
  ],
} as const);
