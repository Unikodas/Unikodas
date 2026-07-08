import { defineBrandKnowledge, reference } from './types';

export const NISSAN_CODES = ['GTR', 'SKYLINE', '370Z', '350Z', 'SILVIA', 'NISMO'] as const;

export const NISSAN_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Nissan',
  commonAbbreviations: ['NIS'],
  popularModels: ['GT-R', 'Skyline', '370Z', '350Z', 'Silvia'],
  performanceModels: ['GT-R', 'Nismo'],
  knownNicknames: ['GTR', 'Godzilla'],
  commonEngineModelReferences: ['RB26', 'SR20', 'VR38'],
  collectorNotes: 'Nissan GT-R, Skyline, Silvia ir Nismo yra labai stiprūs JDM entuziastų motyvai.',
  references: [
    reference('NISSAN', 'Nissan', 'BRAND', 86, 'Nissan gali sietis su GT-R, Skyline ir JDM kultūra.', ['NIS'], ['GTR', 'SKYLINE', 'NISMO'], 'Nissan'),
    ...NISSAN_CODES.map((code) =>
      reference(code, `Nissan ${code === 'GTR' ? 'GT-R' : code}`, ['GTR', 'NISMO', 'SKYLINE'].includes(code) ? 'PERFORMANCE' : 'MODEL', code === 'GTR' ? 97 : 88, `${code} gali priminti Nissan ${code === 'GTR' ? 'GT-R' : code} modelį arba Nismo kultūrą.`, [`NIS${code}`, `NISSAN${code}`, code === 'GTR' ? 'GT-R' : code], ['GTR', 'NISMO', 'SKYLINE'], 'Nissan'),
    ),
    reference('RB26', 'Nissan RB26', 'ENGINE', 92, 'RB26 variklis labai siejamas su Skyline GT-R.', [], ['GTR', 'SKYLINE'], 'Nissan'),
    reference('SR20', 'Nissan SR20', 'ENGINE', 86, 'SR20 yra atpažįstamas Nissan Silvia ir JDM tiuningo motyvas.', [], ['SILVIA', 'JDM'], 'Nissan'),
    reference('VR38', 'Nissan VR38', 'ENGINE', 86, 'VR38 gali priminti modernų Nissan GT-R variklį.', [], ['GTR', 'NISMO'], 'Nissan'),
  ],
} as const);

