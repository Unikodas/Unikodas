import { defineBrandKnowledge, reference } from './types';

export const TOYOTA_CODES = ['SUPRA', 'GR86', 'GT86', 'CELICA', 'MR2', 'LANDCRUISER'] as const;

export const TOYOTA_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Toyota',
  commonAbbreviations: ['TOY'],
  popularModels: ['Supra', 'GR86', 'GT86', 'Celica', 'MR2', 'Land Cruiser'],
  performanceModels: ['Supra', 'GR86', 'GT86'],
  knownNicknames: ['Yota'],
  commonEngineModelReferences: ['86', '2JZ', '1JZ'],
  collectorNotes: 'Toyota Supra, 86 ir JZ variklių motyvai dažnai patrauklūs JDM entuziastams.',
  references: [
    reference('TOYOTA', 'Toyota', 'BRAND', 88, 'Toyota markė gali būti įdomi JDM ir patikimumo asociacijų ieškantiems žmonėms.', ['TOY', 'YOTA'], ['SUPRA', 'GR86', 'GT86'], 'Toyota'),
    ...TOYOTA_CODES.map((code) =>
      reference(code, `Toyota ${code === 'LANDCRUISER' ? 'Land Cruiser' : code}`, ['SUPRA', 'GR86', 'GT86'].includes(code) ? 'PERFORMANCE' : 'MODEL', 88, `${code} gali priminti Toyota ${code === 'LANDCRUISER' ? 'Land Cruiser' : code} modelį.`, [`TOY${code}`, `TOYOTA${code}`], ['SUPRA', 'GR86', 'GT86'], 'Toyota'),
    ),
    reference('2JZ', 'Toyota 2JZ', 'ENGINE', 94, '2JZ variklis yra vienas žinomiausių JDM ir Toyota Supra entuziastų motyvų.', ['JZ2'], ['SUPRA', '1JZ', 'JDM'], 'Toyota'),
    reference('1JZ', 'Toyota 1JZ', 'ENGINE', 88, '1JZ taip pat atpažįstamas JDM ir Toyota tiuningo aplinkoje.', ['JZ1'], ['SUPRA', '2JZ'], 'Toyota'),
  ],
} as const);

