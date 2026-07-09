import { defineKnowledgeEntries } from '../schema';

export const PLATE_CONCEPTS_ENTRIES = defineKnowledgeEntries([
  {
    keyword: '777',
    displayName: '777',
    aliases: ['TRYS SEPTYNETAI', 'SEPTYNETAI'],
    category: 'plate-concepts',
    subcategory: 'number-pattern',
    confidence: 92,
    language: 'lt',
    country: 'LT',
    description:
      '777 yra pasikartojantis skaičių derinys, kuris numeriuose dažnai siejamas su sėkme, lengvu įsiminimu ir kolekciniu patrauklumu.',
    collectorNotes:
      'Trigubi vienodi skaičiai, ypač 777, Lietuvos numeriuose atrodo švariai, greitai įsimena ir gali patikti pirkėjams, ieškantiems simbolinio derinio.',
    relatedKeywords: ['VIP777', 'TOP777', 'AAA777', '7777', '007', '888', '999'],
    tags: ['number-pattern', 'lucky', 'collector', 'memorable'],
  },
  {
    keyword: 'VARDINIAI',
    displayName: 'Vardiniai numeriai',
    aliases: ['VARDINIS', 'PERSONALIZUOTI', 'PERSONALIZUOTAS', 'NAME PLATE'],
    category: 'plate-concepts',
    subcategory: 'personalized',
    confidence: 90,
    language: 'lt',
    country: 'LT',
    description:
      'Vardiniai numeriai yra deriniai, kurie primena vardą, inicialus, pravardę, įmonės pavadinimą arba kitą asmeninę reikšmę.',
    collectorNotes:
      'Tokie numeriai dažnai patrauklūs konkrečiam žmogui ar verslui, nes jų vertė kyla iš asmeninio ryšio ir lengvo atpažinimo.',
    relatedKeywords: ['MATAS', 'DOMAS', 'JONAS', 'TOMAS', 'VIP', 'BOSS'],
    tags: ['personalized', 'name', 'hidden-meaning', 'collector'],
  },
  {
    keyword: 'VYTIS',
    displayName: 'Numeriai su Vyčiu',
    aliases: ['VYČIO NUMERIAI', 'VYCIO NUMERIAI', 'VYTIS NUMERIAI'],
    category: 'plate-concepts',
    subcategory: 'symbol',
    confidence: 88,
    language: 'lt',
    country: 'LT',
    description:
      'Numeriai su Vyčiu išsiskiria Lietuvos simbolika ir gali būti pasirenkami dėl reprezentacinio, patriotinio arba vizualiai švaresnio įvaizdžio.',
    collectorNotes:
      'Vytis pats savaime negarantuoja kainos, tačiau kartu su stipriu raidžių ir skaičių deriniu gali sustiprinti bendrą numerio įspūdį.',
    relatedKeywords: ['LT', 'LIETUVA', 'VILNIUS', 'KAUNAS', '777'],
    tags: ['symbol', 'lithuania', 'identity', 'collector'],
  },
  {
    keyword: 'MOTOCIKLAI',
    displayName: 'Motociklų numeriai',
    aliases: ['MOTOCIKLU NUMERIAI', 'MOTOCIKLO NUMERIAI', 'MOTORCYCLE'],
    category: 'plate-concepts',
    subcategory: 'motorcycle',
    confidence: 88,
    language: 'lt',
    country: 'LT',
    description:
      'Motociklų numeriai yra atskira numerių tema, kur svarbūs trumpi, ryškūs ir lengvai perskaitomi deriniai.',
    collectorNotes:
      'Motociklų entuziastams gali būti įdomūs deriniai, susiję su marke, modeliu, variklio tūriu ar trumpu asmeniniu kodu.',
    relatedKeywords: ['HARLEY', 'DUCATI', 'KTM', 'YAMAHA', 'BMW', 'R1', 'GSXR'],
    tags: ['motorcycle', 'two-wheels', 'collector', 'automotive'],
  },
  {
    keyword: 'M',
    displayName: 'BMW M',
    aliases: ['BMW M', 'M POWER', 'MPOWER'],
    category: 'plate-concepts',
    subcategory: 'performance',
    confidence: 86,
    language: 'multi',
    country: 'DE',
    description:
      'M raidė automobilių kontekste dažnai primena BMW M sportinių modelių šeimą, ypač kai numeris turi papildomų BMW ar modelio užuominų.',
    collectorNotes:
      'Vien tik M yra plati ir atsargi asociacija, bet kartu su M2, M3, M5, M550 ar BMW motyvais ji gali būti labai atpažįstama entuziastams.',
    relatedKeywords: ['BMW', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M550'],
    tags: ['automotive', 'performance', 'BMW', 'M'],
  },
]);
