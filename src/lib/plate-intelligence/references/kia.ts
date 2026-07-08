import { defineBrandKnowledge, reference } from './types';

export const KIA_CODES = ['STINGER', 'GT', 'CEEDGT', 'EV6', 'EV9'] as const;

export const KIA_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Kia',
  commonAbbreviations: ['KIA'],
  popularModels: ['Stinger', 'Ceed GT', 'EV6', 'EV9'],
  performanceModels: ['Stinger GT', 'Ceed GT', 'EV6 GT'],
  knownNicknames: [],
  commonEngineModelReferences: ['GT', 'EV6'],
  collectorNotes: 'Kia Stinger GT ir EV6 GT motyvai gali būti atpažįstami šiuolaikinių performance automobilių gerbėjams.',
  references: [
    reference('KIA', 'Kia', 'BRAND', 78, 'Kia markė gali sietis su Stinger GT ir EV modeliais.', [], ['STINGER', 'EV6', 'GT'], 'Kia'),
    ...KIA_CODES.map((code) =>
      reference(code, `Kia ${code}`, code.includes('GT') || code === 'STINGER' ? 'PERFORMANCE' : 'MODEL', 78, `${code} gali priminti Kia ${code} modelį arba sportinę versiją.`, [`KIA${code}`], ['STINGER', 'EV6', 'GT'], 'Kia'),
    ),
  ],
} as const);

