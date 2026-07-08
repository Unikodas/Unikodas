import { defineBrandKnowledge, reference } from './types';

export const LAMBORGHINI_CODES = ['SVJ', 'SV', 'STO', 'HURACAN', 'AVENTADOR', 'REVUELTO', 'PERFORMANTE', 'EVO'] as const;

export const LAMBORGHINI_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Lamborghini',
  commonAbbreviations: ['LAM', 'LAMBO'],
  popularModels: ['Huracan', 'Aventador', 'Revuelto'],
  performanceModels: ['SVJ', 'SV', 'STO', 'Performante'],
  knownNicknames: ['Lambo'],
  commonEngineModelReferences: ['V10', 'V12'],
  collectorNotes: 'Lamborghini SVJ, STO ir SV žymėjimai yra labai stiprūs superautomobilių motyvai.',
  references: [
    reference('LAMBORGHINI', 'Lamborghini', 'BRAND', 96, 'Lamborghini markė turi labai stiprią superautomobilių asociaciją.', ['LAMBO', 'LAM'], ['SVJ', 'STO', 'AVENTADOR'], 'Lamborghini'),
    reference('SVJ', 'Lamborghini Aventador SVJ', 'SUPERCAR', 100, 'SVJ yra vienas žinomiausių Lamborghini Aventador variantų.', ['LAMSVJ', 'LAMBOSVJ'], ['STO', 'SV', 'LAM777'], 'Lamborghini'),
    reference('STO', 'Lamborghini Huracan STO', 'SUPERCAR', 96, 'STO dažnai siejama su Lamborghini Huracan STO.', ['LAMSTO', 'HURACANSTO'], ['SVJ', 'SV', 'LAM777'], 'Lamborghini'),
    reference('SV', 'Lamborghini SuperVeloce', 'SUPERCAR', 86, 'SV gali priminti Lamborghini SuperVeloce žymėjimą.', ['LAMSV'], ['SVJ', 'STO'], 'Lamborghini'),
    reference('LAMEVO', 'Lamborghini Evo', 'SUPERCAR', 86, 'Lamborghini Evo galima asociacija atsiranda stipriau, kai EVO derinys palaikomas Lamborghini trumpiniu.', ['HURACANEVO'], ['SVJ', 'STO', 'EVO'], 'Lamborghini'),
    ...LAMBORGHINI_CODES.filter((code) => !['SVJ', 'STO', 'SV', 'EVO'].includes(code)).map((code) =>
      reference(code, `Lamborghini ${code}`, 'SUPERCAR', 90, `${code} gali priminti Lamborghini ${code} modelį arba versiją.`, [`LAM${code}`, `LAMBO${code}`], ['SVJ', 'STO', 'AVENTADOR'], 'Lamborghini'),
    ),
  ],
} as const);
