import { defineBrandKnowledge, reference } from './types';

export const HONDA_CODES = ['CIVIC', 'TYPER', 'INTEGRA', 'S2000', 'NSX'] as const;

export const HONDA_KNOWLEDGE = defineBrandKnowledge({
  brandName: 'Honda',
  commonAbbreviations: ['HON'],
  popularModels: ['Civic', 'Integra', 'S2000', 'NSX'],
  performanceModels: ['Type R', 'NSX', 'S2000'],
  knownNicknames: ['VTEC'],
  commonEngineModelReferences: ['VTEC', 'K20', 'K24', 'B16', 'B18'],
  collectorNotes: 'Honda Type R, VTEC, S2000 ir NSX yra labai atpažįstami JDM motyvai.',
  references: [
    reference('HONDA', 'Honda', 'BRAND', 88, 'Honda markė dažnai siejama su JDM, VTEC ir Type R kultūra.', ['HON'], ['CIVIC', 'TYPER', 'VTEC'], 'Honda'),
    ...HONDA_CODES.map((code) =>
      reference(code, `Honda ${code === 'TYPER' ? 'Type R' : code}`, code === 'TYPER' || code === 'NSX' || code === 'S2000' ? 'PERFORMANCE' : 'MODEL', 90, `${code} gali priminti Honda ${code === 'TYPER' ? 'Type R' : code} modelį.`, [`HON${code}`, `HONDA${code}`, code === 'TYPER' ? 'TYPE R' : code], ['CIVIC', 'TYPER', 'VTEC'], 'Honda'),
    ),
    reference('VTEC', 'Honda VTEC', 'ENGINE', 94, 'VTEC yra vienas atpažįstamiausių Honda entuziastų trumpinių.', ['VTEK'], ['CIVIC', 'TYPER', 'S2000'], 'Honda'),
    reference('K20', 'Honda K20', 'ENGINE', 84, 'K20 variklio kodas dažnai pažįstamas Honda tiuningo bendruomenei.', [], ['K24', 'TYPER'], 'Honda'),
    reference('K24', 'Honda K24', 'ENGINE', 82, 'K24 gali priminti Honda K serijos variklį.', [], ['K20', 'TYPER'], 'Honda'),
  ],
} as const);

