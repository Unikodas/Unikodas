export const BMW_MODEL_NUMBERS = [
  '116',
  '118',
  '120',
  '125',
  '128',
  '130',
  '135',
  '140',
  '316',
  '318',
  '320',
  '325',
  '328',
  '330',
  '335',
  '340',
  '420',
  '425',
  '428',
  '430',
  '435',
  '440',
  '520',
  '525',
  '528',
  '530',
  '535',
  '540',
  '545',
  '550',
  '630',
  '635',
  '640',
  '645',
  '650',
  '730',
  '735',
  '740',
  '745',
  '750',
  '760',
] as const;

export const BMW_SERIES_CODES = ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'X3', 'X5', 'X6', 'X7', 'I3', 'I4', 'I5', 'I7', 'I8'] as const;

export const MERCEDES_MODEL_NUMBERS = [
  '180',
  '200',
  '220',
  '230',
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

export const MERCEDES_CLASSES = ['CLA', 'CLS', 'A', 'C', 'E', 'S', 'G'] as const;
export const AMG_NUMBERS = ['43', '53', '63', '65'] as const;

export const AUDI_CODES = [
  'RS3',
  'RS4',
  'RS5',
  'RS6',
  'RS7',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'S3',
  'S4',
  'S5',
  'S6',
  'S7',
  'S8',
  'Q3',
  'Q5',
  'Q7',
  'Q8',
  'R8',
] as const;

export const PORSCHE_CODES = ['GT2', 'GT3', 'GT4', '911', '718', '918', '992', '991', '997', '996', 'TURBO'] as const;
export const VOLKSWAGEN_CODES = ['GTI', 'R32', 'R36', 'GOLF', 'PASSAT'] as const;

export const CAR_MODEL_TERMS = [
  ...BMW_MODEL_NUMBERS.map((model) => ({
    text: `BMW ${model}`,
    aliases: [`BMW${model}`, model],
    brand: 'BMW',
    related: getBmwRelated(model),
  })),
  ...BMW_SERIES_CODES.map((code) => ({
    text: `BMW ${code}`,
    aliases: [code, `BMW${code}`],
    brand: 'BMW',
    related: ['BMW M3', 'BMW M4', 'BMW M5', 'BMW M8'],
  })),
  ...MERCEDES_MODEL_NUMBERS.map((model) => ({
    text: `Mercedes ${model}`,
    aliases: [model, `MB${model}`, `BENZ${model}`],
    brand: 'Mercedes-Benz',
    related: ['AMG063', 'S063', 'G063'],
  })),
  {
    text: 'Mercedes AMG 43',
    aliases: ['AMG43', 'AMG043', 'C43', 'C043', 'S43', 'S043'],
    brand: 'Mercedes-Benz',
    related: ['AMG053', 'AMG063', 'C43', 'S43'],
  },
  {
    text: 'Mercedes AMG 53',
    aliases: ['AMG53', 'AMG053', 'E53', 'E053', 'CLS53'],
    brand: 'Mercedes-Benz',
    related: ['AMG043', 'AMG063', 'E53', 'CLS53'],
  },
  {
    text: 'Mercedes AMG 63',
    aliases: ['AMG63', 'AMG063', 'S63', 'S063', 'G63', 'G063', 'C63', 'E63', 'CLA45', 'CLS63'],
    brand: 'Mercedes-Benz',
    related: ['AMG043', 'AMG053', 'AMG063', 'S063', 'G063'],
  },
  {
    text: 'Mercedes AMG 65',
    aliases: ['AMG65', 'AMG065', 'S65', 'G65'],
    brand: 'Mercedes-Benz',
    related: ['S063', 'G063', 'AMG063'],
  },
  ...AUDI_CODES.map((code) => ({
    text: `Audi ${code}`,
    aliases: [code],
    brand: 'Audi',
    related: code.startsWith('RS') ? ['RS3', 'RS4', 'RS5', 'RS6', 'S6', 'RS777'] : ['A6', 'S6', 'RS6', 'Q7'],
  })),
  ...PORSCHE_CODES.map((code) => ({
    text: `Porsche ${code}`,
    aliases: [code],
    brand: 'Porsche',
    related: ['GT2', 'GT3', 'GT4', '911', '992'],
  })),
  ...VOLKSWAGEN_CODES.map((code) => ({
    text: `Volkswagen ${code}`,
    aliases: [code],
    brand: 'Volkswagen',
    related: ['GTI', 'R32', 'R36', 'GOLF'],
  })),
] as const;

function getBmwRelated(model: string): string[] {
  const series = model[0];
  const seriesModels = BMW_MODEL_NUMBERS.filter((candidate) => candidate.startsWith(series));
  const index = seriesModels.indexOf(model as (typeof BMW_MODEL_NUMBERS)[number]);
  const nearby =
    index >= 0
      ? [...seriesModels.slice(index + 1), ...seriesModels.slice(Math.max(0, index - 2), index)]
      : seriesModels;
  return [...nearby.slice(0, 4).map((candidate) => `BMW${candidate}`), 'BMW M5'];
}
