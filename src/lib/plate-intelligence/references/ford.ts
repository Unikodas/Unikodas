import { defineBrandKnowledge, reference } from './types';

export const FORD_CODES = ['MUSTANG', 'GT', 'FOCUS', 'FOCUSRS', 'FOCUSST', 'FIESTAST', 'RS', 'ST', 'RAPTOR'] as const;

export const FORD_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Ford',
  commonAbbreviations: ['FRD'],
  popularModels: ['Mustang', 'Focus', 'Fiesta', 'Raptor'],
  performanceModels: ['Mustang GT', 'Focus RS', 'Focus ST', 'Fiesta ST', 'Raptor'],
  knownNicknames: ['Stang'],
  commonEngineModelReferences: ['GT', 'RS', 'ST', 'V8'],
  collectorNotes: 'Ford Mustang, RS ir ST žymėjimai yra aiškiai atpažįstami performance motyvai.',
  references: [
    reference('FORD', 'Ford', 'BRAND', 84, 'Ford markė gali priminti Mustang, RS, ST arba Raptor modelius.', ['FRD'], ['MUSTANG', 'FOCUSRS', 'RAPTOR'], 'Ford'),
    ...FORD_CODES.map((code) =>
      reference(code, `Ford ${code}`, ['MUSTANG', 'GT', 'FOCUSRS', 'FOCUSST', 'FIESTAST', 'RS', 'ST', 'RAPTOR'].includes(code) ? 'PERFORMANCE' : 'MODEL', 84, `${code} gali priminti Ford modelį arba sportinę versiją.`, [`FORD${code}`], ['MUSTANG', 'FOCUSRS', 'RAPTOR'], 'Ford'),
    ),
  ],
} as const);

