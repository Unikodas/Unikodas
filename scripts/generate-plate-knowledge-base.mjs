import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'src/lib/plate-intelligence/database');

const categories = [
  'cars','motorcycles','trucks','engines','gearboxes','performance','manufacturers','supercars','motorsport',
  'people','lithuanian-names','english-names','nicknames','famous-people','athletes','drivers','musicians',
  'places','countries','cities','villages','airports','roads','brands','luxury','fashion','technology','gaming','food',
  'aviation','military','ships','space','movies','tv','anime','games','business','finance','sports','music','internet',
  'common-words','slang','abbreviations','roman-numerals','chemical-elements','greek-letters','latin-words','religion',
  'history','mythology','animals','birds','fish','dogs','cats','luxury-watches','alcohol','cigars','boats','bikes','tools',
  'construction','agriculture','universities','government','emergency','medical','science','weather','nature',
];

const entriesByCategory = Object.fromEntries(categories.map((category) => [category, []]));
const seen = new Set();

const words = (value) => value.split('|').map((item) => item.trim()).filter(Boolean);
const norm = (value) => String(value).normalize('NFKD').toUpperCase().replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '');

function add(category, subcategory, keyword, displayName = keyword, options = {}) {
  const cleanKeyword = norm(keyword);
  if (!entriesByCategory[category] || !cleanKeyword) return;
  const id = `${category}:${subcategory}:${cleanKeyword}:${norm(displayName)}`;
  if (seen.has(id)) return;
  seen.add(id);
  entriesByCategory[category].push({
    keyword: String(keyword),
    displayName: String(displayName),
    aliases: options.aliases ?? [],
    category,
    subcategory,
    confidence: options.confidence ?? 72,
    language: options.language ?? 'multi',
    country: options.country ?? null,
    description: options.description ?? `${displayName} gali būti atpažįstama reikšmė numerio derinyje.`,
    collectorNotes: options.collectorNotes ?? `${displayName} gali būti įdomu žmonėms, kuriems ši reikšmė artima.`,
    relatedKeywords: options.relatedKeywords ?? [],
    tags: options.tags ?? [],
  });
}

function addMany(category, subcategory, values, options = {}) {
  for (const value of values) {
    if (typeof value === 'string') add(category, subcategory, value, value, options);
    else add(category, subcategory, value.keyword, value.displayName ?? value.keyword, { ...options, ...value });
  }
}

function addAutomotiveBrand(brand, data) {
  add('manufacturers', 'car-brand', brand, data.displayName ?? brand, {
    aliases: data.aliases ?? [],
    country: data.country ?? null,
    confidence: data.confidence ?? 92,
    collectorNotes: `${data.displayName ?? brand} yra automobilių markė, kuri gali būti aiški entuziastų asociacija.`,
    relatedKeywords: data.models.slice(0, 10),
    tags: ['automotive', 'brand', brand],
  });
  for (const alias of data.aliases ?? []) {
    add('manufacturers', 'brand-alias', alias, data.displayName ?? brand, {
      aliases: [brand],
      country: data.country ?? null,
      confidence: 82,
      collectorNotes: `${alias} gali būti trumpinys, siejamas su ${data.displayName ?? brand}.`,
      relatedKeywords: [brand, ...data.models.slice(0, 4)],
      tags: ['automotive', 'brand-alias', brand],
    });
  }
  for (const model of data.models) {
    const display = `${data.displayName ?? brand} ${model.replace(/([A-Z])([0-9])/g, '$1 $2')}`;
    add('cars', 'production-model', `${brand}${model}`, display, {
      aliases: [model, `${brand} ${model}`, `${data.displayName ?? brand} ${model}`],
      country: data.country ?? null,
      confidence: model.length <= 2 ? 64 : data.modelConfidence ?? 88,
      collectorNotes: `${display} gali priminti gamybinį modelį arba modelio šeimą.`,
      relatedKeywords: [brand, ...(data.performance ?? []).slice(0, 8)],
      tags: ['automotive', 'model', brand],
    });
    add('cars', 'model-keyword', model, display, {
      aliases: [`${brand}${model}`, `${brand} ${model}`],
      country: data.country ?? null,
      confidence: model.length <= 2 ? 52 : 70,
      collectorNotes: `${model} vienas pats gali priminti ${display}, tačiau be markės ši asociacija vertinama atsargiau.`,
      relatedKeywords: [brand],
      tags: ['automotive', 'model-keyword', brand],
    });
  }
  for (const code of data.codes ?? []) {
    add('cars', 'chassis-code', `${brand}${code}`, `${data.displayName ?? brand} ${code}`, {
      aliases: [code],
      country: data.country ?? null,
      confidence: 80,
      collectorNotes: `${code} gali būti ${data.displayName ?? brand} entuziastams atpažįstamas kartos, kėbulo ar platformos kodas.`,
      relatedKeywords: [brand, ...data.models.slice(0, 5)],
      tags: ['automotive', 'chassis', brand],
    });
  }
  for (const item of data.performance ?? []) {
    add('performance', 'brand-performance', item, item, {
      aliases: [`${brand}${item}`, `${brand} ${item}`],
      country: data.country ?? null,
      confidence: 84,
      collectorNotes: `${item} gali būti sportinės, retos arba entuziastams įdomios ${data.displayName ?? brand} versijos motyvas.`,
      relatedKeywords: [brand, ...data.models.slice(0, 5)],
      tags: ['automotive', 'performance', brand],
    });
    add('performance', 'brand-performance-combo', `${brand}${item}`, `${data.displayName ?? brand} ${item}`, {
      aliases: [`${brand} ${item}`, item],
      country: data.country ?? null,
      confidence: 88,
      collectorNotes: `${data.displayName ?? brand} ${item} yra stipresnė asociacija, nes markė ir sportinis žymėjimas palaiko vienas kitą.`,
      relatedKeywords: [brand, item],
      tags: ['automotive', 'performance-combo', brand],
    });
  }
  for (const engine of data.engines ?? []) {
    add('engines', 'brand-engine', engine, engine, {
      aliases: [`${brand}${engine}`],
      country: data.country ?? null,
      confidence: 86,
      collectorNotes: `${engine} gali būti entuziastams atpažįstamas variklio arba pavaros kodas.`,
      relatedKeywords: [brand],
      tags: ['automotive', 'engine', brand],
    });
    add('engines', 'brand-engine-combo', `${brand}${engine}`, `${data.displayName ?? brand} ${engine}`, {
      aliases: [`${brand} ${engine}`, engine],
      country: data.country ?? null,
      confidence: 88,
      collectorNotes: `${data.displayName ?? brand} ${engine} gali būti aiški markės ir variklio kodo kombinacija.`,
      relatedKeywords: [brand, engine],
      tags: ['automotive', 'engine-combo', brand],
    });
  }
}

const auto = {
  BMW: { country:'DE', aliases:words('BIMMER|BEEMER|BEMAS'), models:words('1SERIES|2SERIES|3SERIES|4SERIES|5SERIES|6SERIES|7SERIES|8SERIES|114|116|118|120|123|125|128|130|135|140|216|218|220|225|228|230|235|240|316|318|320|323|325|328|330|335|340|418|420|425|428|430|435|440|518|520|523|525|528|530|535|540|545|550|630|635|640|645|650|730|735|740|745|750|760|M1|M2|M3|M4|M5|M6|M8|X1|X2|X3|X4|X5|X6|X7|Z3|Z4|Z8|I3|I4|I5|I7|I8|IX|XM'), codes:words('E21|E30|E34|E36|E38|E39|E46|E53|E60|E61|E63|E64|E65|E70|E71|E82|E87|E90|E91|E92|E93|F10|F11|F12|F13|F20|F21|F22|F30|F31|F32|F33|F34|F36|F80|F82|F83|F90|G20|G21|G22|G26|G30|G31|G60|G70|G80|G81|G82|G87'), performance:words('MPOWER|COMPETITION|CS|CSL|XDRIVE'), engines:words('B58|S58|N54|N55|M57|M54|S54|S55|S65|S85') },
  MERCEDES: { displayName:'Mercedes-Benz', country:'DE', aliases:words('MB|MERC|BENZ'), models:words('A|B|C|CLA|CLS|E|S|G|GLA|GLB|GLC|GLE|GLS|SL|SLC|SLK|AMGGT|EQA|EQB|EQC|EQE|EQS|180|200|220|230|240|250|280|300|320|350|400|430|450|500|550|560|580|600|A35|A45|C43|C63|E53|E55|E63|S63|S65|G63|G65|CLA45|CLS63'), codes:words('W108|W109|W110|W111|W112|W113|W114|W115|W116|W123|W124|W126|W140|W201|W202|W203|W204|W205|W206|W210|W211|W212|W213|W214|W220|W221|W222|W223|W463|R129|R230|R231|C107|C126|C215|C216|C217'), performance:words('AMG|BRABUS|MAYBACH|BLACKSERIES|KOMPRESSOR|BITURBO'), engines:words('OM606|OM642|M113|M156|M177|M178') },
  AUDI: { country:'DE', aliases:words('AUD|QUATTRO'), models:words('A1|A2|A3|A4|A5|A6|A7|A8|S1|S3|S4|S5|S6|S7|S8|RS2|RS3|RS4|RS5|RS6|RS7|TT|TTS|TTRS|R8|Q2|Q3|Q4|Q5|Q7|Q8|SQ5|SQ7|SQ8|ETRON'), codes:words('B5|B6|B7|B8|B9|C4|C5|C6|C7|C8|D2|D3|D4|D5|8L|8P|8V|8Y'), performance:words('QUATTRO|AVANT|SPORTBACK|ABT'), engines:words('TFSI|FSI|TDI|20VT|VR6') },
  VOLKSWAGEN: { country:'DE', aliases:words('VW|VAG'), models:words('GOLF|POLO|PASSAT|ARTEON|SCIROCCO|JETTA|BORA|TOUAREG|TIGUAN|TOURAN|PHAETON|BEETLE|CORRADO|UP|ID3|ID4|ID5|IDBUZZ|GTI|GTD|GTE|GOLFR|R32|R36'), codes:words('MK1|MK2|MK3|MK4|MK5|MK6|MK7|MK8|B5|B6|B7|B8'), performance:words('GTI|GTD|GTE|RLINE|ABT'), engines:words('TDI|TSI|FSI|TFSI|VR6|20VT') },
  PORSCHE: { country:'DE', aliases:words('POR|PORS|PORSCH'), models:words('356|911|912|914|924|928|944|968|BOXSTER|CAYMAN|CAYENNE|MACAN|PANAMERA|TAYCAN|718|918|992|991|997|996|993|964|930|GT2|GT3|GT4|TURBO|CARRERA|TARGA|RS|SPEEDSTER'), codes:words('992|991|997|996|993|964|930|981|982|987|986'), performance:words('GT2RS|GT3RS|TURBOS|GTS|RS') },
  TOYOTA: { country:'JP', aliases:words('TOY|YOTA'), models:words('SUPRA|GRSUPRA|GR86|GT86|CELICA|MR2|LANDCRUISER|PRADO|COROLLA|CAMRY|PRIUS|YARIS|GRYARIS|CHASER|MARK2|CROWN|AE86|HILUX|RAV4'), codes:words('A70|A80|A90|AE86|JZX90|JZX100|JZX110'), performance:words('GR|TRD'), engines:words('2JZ|1JZ|4AGE|3SGTE') },
  HONDA: { country:'JP', aliases:words('HON'), models:words('CIVIC|ACCORD|PRELUDE|INTEGRA|S2000|NSX|CRX|CRV|HRV|JAZZ|TYPER|EK9|EP3|FN2|FD2|FK2|FK8|FL5'), codes:words('EG|EK|EP|FN|FD|FK|FL|DC2|DC5|AP1|AP2'), performance:words('MUGEN|SIR|TYPER'), engines:words('VTEC|K20|K24|B16|B18|F20C') },
  SUBARU: { country:'JP', aliases:words('SUB|SCOOBY'), models:words('IMPREZA|WRX|STI|BRZ|FORESTER|LEGACY|OUTBACK|LEVORG|SVX'), codes:words('GC8|GD|GR|VA|VB'), performance:words('STI|555'), engines:words('EJ20|EJ25|FA20|FA24') },
  MITSUBISHI: { country:'JP', aliases:words('MIT|MITSU'), models:words('LANCER|EVO|EVOLUTION|GALANT|ECLIPSE|3000GT|GTO|PAJERO|OUTLANDER|COLT'), codes:words('EVO1|EVO2|EVO3|EVO4|EVO5|EVO6|EVO7|EVO8|EVO9|EVO10'), performance:words('RALLIART'), engines:words('4G63|4B11') },
  NISSAN: { country:'JP', aliases:words('NIS'), models:words('GTR|SKYLINE|SILVIA|350Z|370Z|400Z|Z|FAIRLADY|JUKE|QASHQAI|PATROL|NAVARA|MICRA|SENTRA|MAXIMA|NISMO'), codes:words('R32|R33|R34|R35|S13|S14|S15|Z32|Z33|Z34'), performance:words('NISMO'), engines:words('RB26|RB25|SR20|VR38|VQ35|VQ37') },
  MAZDA: { country:'JP', aliases:words('MZD'), models:words('MX5|MIATA|RX7|RX8|MAZDA3|MAZDA6|CX3|CX5|CX7|CX9|CX30|CX60|CX90|626|323'), codes:words('NA|NB|NC|ND|FD|FC'), performance:words('MPS|MAZDASPEED'), engines:words('13B|20B|RENESIS') },
  LEXUS: { country:'JP', aliases:words('LEX'), models:words('IS|GS|LS|ES|RX|NX|UX|GX|LX|RC|LC|LFA|ISF|RCF|GSF|FSPORT'), performance:words('FSPORT|F'), engines:words('V8|V10') },
  VOLVO: { country:'SE', aliases:words('VOL'), models:words('S40|S60|S80|S90|V40|V50|V60|V70|V90|XC40|XC60|XC70|XC90|C30|C70|850|940|960'), performance:words('RDESIGN|POLESTAR|T5|T6|T8'), engines:words('T5|T6|T8') },
  SAAB: { country:'SE', models:words('900|9000|93|95|97X|AERO|VIGGEN'), performance:words('AERO|VIGGEN'), engines:words('TURBO') },
  FERRARI: { country:'IT', aliases:words('FER|FERR'), models:words('360|430|458|488|F8|296|812|F12|SF90|ROMA|PORTOFINO|CALIFORNIA|ENZO|LAFERRARI|F40|F50|TESTAROSSA|DAYTONA|DINO|599|612|GTC4LUSSO'), performance:words('SCUDERIA|PISTA|SPECIALE'), engines:words('V8|V12') },
  LAMBORGHINI: { country:'IT', aliases:words('LAM|LAMBO'), models:words('MIURA|COUNTACH|DIABLO|MURCIELAGO|GALLARDO|HURACAN|AVENTADOR|REVUELTO|URUS|SV|SVJ|STO|PERFORMANTE|EVO|SUPERVELOCE'), performance:words('SVJ|STO|SV|PERFORMANTE'), engines:words('V10|V12') },
  MCLAREN: { country:'GB', aliases:words('MCL|MCLRN'), models:words('540C|570S|600LT|620R|650S|675LT|720S|750S|765LT|ARTURA|P1|SENNA|SPEEDTAIL|ELVA|GT'), performance:words('LT'), engines:words('V8|HYBRID') },
  BUGATTI: { country:'FR', aliases:words('BUG'), models:words('VEYRON|CHIRON|DIVO|CENTODIECI|BOLIDE|TOURBILLON'), performance:words('SUPERSPORT|PURSPORT'), engines:words('W16') },
  KOENIGSEGG: { country:'SE', aliases:words('KOE|KSEGG'), models:words('CC8S|CCR|CCX|AGERA|ONE1|REGERA|JESKO|GEMERA|CC850'), performance:words('ABSOLUT|ATTACK'), engines:words('V8') },
  PAGANI: { country:'IT', aliases:words('PAG'), models:words('ZONDA|HUAYRA|UTOPIA'), performance:words('R|BC'), engines:words('V12') },
  ASTONMARTIN: { displayName:'Aston Martin', country:'GB', aliases:words('ASTON|AM'), models:words('DB5|DB7|DB9|DB11|DB12|VANTAGE|VANQUISH|VIRAGE|RAPIDE|DBS|VALKYRIE|VALHALLA'), performance:words('AMR'), engines:words('V8|V12') },
  BENTLEY: { country:'GB', aliases:words('BEN'), models:words('CONTINENTAL|CONTIGT|FLYINGSPUR|BENTAYGA|MULSANNE|ARNAGE|AZURE'), performance:words('SPEED'), engines:words('W12|V8') },
  ROLLSROYCE: { displayName:'Rolls-Royce', country:'GB', aliases:words('ROLLS|RR'), models:words('PHANTOM|GHOST|WRAITH|DAWN|CULLINAN|SPECTRE|SILVERSPUR|SILVERSHADOW'), engines:words('V12') },
  PEUGEOT: { country:'FR', aliases:words('PEU'), models:words('106|205|206|207|208|306|307|308|406|407|508|2008|3008|5008|RCZ|GTI'), performance:words('GTI|GT'), engines:words('HDI') },
  RENAULT: { country:'FR', aliases:words('REN'), models:words('CLIO|MEGANE|LAGUNA|TALISMAN|SCENIC|ESPACE|CAPTUR|KADJAR|KOLEOS|TWINGO|ALPINE|RS'), performance:words('RS|TROPHY'), engines:words('DCI') },
  CITROEN: { country:'FR', aliases:words('CIT'), models:words('C1|C2|C3|C4|C5|C6|DS3|DS4|DS5|BERLINGO|SAXO|XSARA'), performance:words('VTS'), engines:words('HDI') },
  OPEL: { country:'DE', aliases:words('OPL|VAUXHALL'), models:words('ASTRA|CORSA|INSIGNIA|VECTRA|OMEGA|CALIBRA|MANTA|KADETT|ZAFIRA|MERIVA|MOKKA'), performance:words('OPC|GSI') },
  FORD: { country:'US', aliases:words('FRD'), models:words('MUSTANG|GT|FOCUS|FIESTA|MONDEO|ESCORT|SIERRA|CAPRI|PUMA|KUGA|RANGER|RAPTOR|F150|F250|BRONCO|GT40'), performance:words('RS|ST|SHELBY|COBRA'), engines:words('COYOTE|V8|ECOBOOST') },
  DODGE: { country:'US', models:words('CHARGER|CHALLENGER|VIPER|DURANGO|RAM|DEMON|HELLCAT'), performance:words('SRT|RT|HELLCAT|DEMON'), engines:words('HEMI|V8') },
  CHEVROLET: { country:'US', aliases:words('CHEVY|CHEV'), models:words('CORVETTE|CAMARO|IMPALA|TAHOE|SUBURBAN|SILVERADO|C8|C7|C6|Z06|ZR1'), performance:words('SS|ZL1|Z06|ZR1'), engines:words('LS1|LS2|LS3|LS7|LT1|LT4') },
  JEEP: { country:'US', models:words('WRANGLER|CHEROKEE|GRANDCHEROKEE|RENEGADE|GLADIATOR|SRT|TRACKHAWK'), performance:words('RUBICON|SRT|TRACKHAWK'), engines:words('HEMI') },
  RAM: { country:'US', models:words('1500|2500|3500|TRX'), performance:words('TRX'), engines:words('HEMI|CUMMINS') },
  TESLA: { country:'US', aliases:words('TES'), models:words('MODELS|MODEL3|MODELX|MODELY|ROADSTER|CYBERTRUCK|SEMI|PLAID'), performance:words('PLAID|PERFORMANCE'), engines:words('EV|ELECTRIC') },
  HYUNDAI: { country:'KR', aliases:words('HYU|HYUN'), models:words('I20|I30|I40|IONIQ|IONIQ5|IONIQ6|KONA|TUCSON|SANTAFE|VELOSTER|GENESIS'), performance:words('N|I20N|I30N|NLINE') },
  KIA: { country:'KR', models:words('CEED|PROCEED|SPORTAGE|SORENTO|STINGER|EV6|EV9|RIO|OPTIMA'), performance:words('GT|GTLINE') },
  CUPRA: { country:'ES', aliases:words('CUP'), models:words('LEON|FORMENTOR|ATECA|BORN|TAVASCAN'), performance:words('VZ|VZ5') },
  SEAT: { country:'ES', models:words('LEON|IBIZA|TOLEDO|ALTEA|ATECA|TARRACO|ARONA'), performance:words('CUPRA|FR') },
  SKODA: { country:'CZ', aliases:words('SKO'), models:words('OCTAVIA|SUPERB|FABIA|RAPID|SCALA|KODIAQ|KAROQ|KAMIQ|ENYAQ'), performance:words('VRS|RS') },
  ALFAROMEO: { displayName:'Alfa Romeo', country:'IT', aliases:words('ALFA'), models:words('GIULIA|GIULIETTA|STELVIO|MITO|BRERA|159|156|147|4C|8C|GTV'), performance:words('QUADRIFOGLIO|Q4'), engines:words('V6') },
  MASERATI: { country:'IT', aliases:words('MAS'), models:words('GHIBLI|QUATTROPORTE|GRANTURISMO|GRANCABRIO|LEVANTE|MC20|GRECALE'), performance:words('TROFEO'), engines:words('V6|V8') },
  FIAT: { country:'IT', models:words('500|500ABARTH|PANDA|PUNTO|BRAVO|TIPO|DUCATO'), performance:words('ABARTH') },
  MINI: { country:'GB', models:words('COOPER|COUNTRYMAN|CLUBMAN|PACEMAN|ROADSTER'), performance:words('JCW|COOPERS') },
  LANDROVER: { displayName:'Land Rover', country:'GB', aliases:words('LR|RANGEROVER'), models:words('DEFENDER|DISCOVERY|RANGEROVER|EVOQUE|VELAR|SPORT|VOGUE'), performance:words('SVR|AUTOBIOGRAPHY'), engines:words('V8') },
  JAGUAR: { country:'GB', aliases:words('JAG'), models:words('XE|XF|XJ|XK|FTYPE|IPACE|EPACE|FPACE'), performance:words('SVR|R'), engines:words('V8') },
  SUZUKI: { country:'JP', aliases:words('SUZ'), models:words('SWIFT|VITARA|JIMNY|SX4|SAMURAI|HAYABUSA'), performance:words('SPORT') },
  INFINITI: { country:'JP', aliases:words('INF'), models:words('G35|G37|Q50|Q60|Q70|FX35|FX37|FX50|QX70'), performance:words('IPL|REDSPORT'), engines:words('VQ35|VQ37') },
  ACURA: { country:'JP', aliases:words('ACU'), models:words('NSX|INTEGRA|RSX|TL|TLX|TSX|MDX|RDX'), performance:words('TYPES'), engines:words('VTEC') },
  GENESIS: { country:'KR', aliases:words('GEN'), models:words('G70|G80|G90|GV60|GV70|GV80|COUPE'), performance:words('SPORT') },
};

for (const [brand, data] of Object.entries(auto)) addAutomotiveBrand(brand, data);

addMany('supercars', 'hypercar', words('APOLLOIE|RIMACNEVERA|RIMACCONCEPTONE|SSCULTIMATEAERO|SSCTUATARA|ZENVO|SALEENS7|NOBLEM600|GUMPERTAPOLLO|HENNESSEYVENOM|HENNESSEYF5|LOTUSEVIJA|LOTUSELISE|LOTUSEXIGE|LOTUSEMIRA|CATERHAM7|ARIELATOM|BACMONO|KTMXBOW'), { confidence:90, collectorNotes:'Tai superautomobilio arba labai reto performance automobilio asociacija.', tags:['supercar','automotive'] });

const motorcycles = {
  YAMAHA: words('R1|R6|R7|R9|R125|MT03|MT07|MT09|MT10|TENERE|TMAX|XSR700|XSR900'),
  BMW: words('S1000RR|M1000RR|R1250GS|R1300GS|F900R|F900XR|K1600'),
  SUZUKI: words('GSXR|GSXR600|GSXR750|GSXR1000|HAYABUSA|SV650|VSTROM|BANDIT'),
  HONDA: words('CBR|CBR600RR|CBR1000RR|CBR650R|AFRICATWIN|FIREBLADE|HORNET|GOLDWING'),
  KAWASAKI: words('ZX6R|ZX10R|ZX4R|NINJA|H2|H2R|Z900|Z1000|VERSYS'),
  DUCATI: words('PANIGALE|MONSTER|STREETFIGHTER|DIAVEL|MULTISTRADA|SCRAMBLER|SUPERSPORT'),
  KTM: words('DUKE|SUPERDUKE|RC390|RC8|ADVENTURE|EXC|SX'),
  HUSQVARNA: words('SVARTPILEN|VITPILEN|NORDEN|TE300|FE350'),
  APRILIA: words('RS660|RSV4|TUONO|DORSODURO'),
  TRIUMPH: words('STREETTRIPLE|SPEEDTRIPLE|BONNEVILLE|DAYTONA|TIGER'),
  HARLEY: words('SPORTSTER|FATBOY|ROADKING|STREETGLIDE|PANAMERICA'),
};
for (const [brand, models] of Object.entries(motorcycles)) {
  add('motorcycles', 'manufacturer', brand, brand, { confidence:84, collectorNotes:`${brand} gali priminti motociklų markę.`, tags:['motorcycle','brand'] });
  for (const model of models) add('motorcycles', 'model', model, `${brand} ${model}`, { aliases:[`${brand}${model}`], confidence:88, collectorNotes:`${model} gali priminti ${brand} motociklo modelį.`, relatedKeywords:[brand], tags:['motorcycle','model',brand] });
}

addMany('engines','engine-code', words('TDI|TSI|FSI|TFSI|VR6|V6|V8|V10|V12|W12|W16|LS1|LS2|LS3|LS6|LS7|LT1|LT4|2JZ|1JZ|RB26|RB25|B58|S58|N54|N55|M57|M54|S54|S55|S65|S85|OM606|OM642|K20|K24|13B|20B|20VT|B16|B18|F20C|4G63|4B11|EJ20|EJ25|FA20|FA24|SR20|VR38|VQ35|VQ37|COYOTE|HEMI|CUMMINS|T5|T6|T8|D5|HDI|DCI|ECOBOOST|RENESIS|ROTARY'), { confidence:86, collectorNotes:'Variklio kodas arba variklio tipas gali būti aiški automobilių entuziastų asociacija.', tags:['engine','automotive'] });
addMany('gearboxes','gearbox', words('DSG|PDK|SMG|DCT|STRONIC|TIPTRONIC|ZF8|ZF6|MANUAL|AUTOMATIC|CVT|SEQUENTIAL|DOGBOX|GETRAG|TREMEC|XTRAC'), { confidence:78, collectorNotes:'Pavarų dėžės trumpinys gali būti įdomus technikos entuziastams.', tags:['gearbox','automotive'] });
addMany('performance','aftermarket', words('AMG|RS|M|GTI|R|TYPER|ST|STI|NISMO|GR|TRD|MUGEN|BRABUS|ALPINA|ABT|AKRAPOVIC|BILSTEIN|KW|OHLINS|BBS|OZ|ROTIFORM|HRE|RECARO|SPARCO|BREMBO|HKS|GREDDY|BLITZ|APEXI|RAYS|VOLK|ENKEI|WORK|TURBO|TWINTURBO|BITURBO|DRIFT|RACE|TRACK|COMPETITION|SPORT|RACING|FAST|LAUNCH|BOOST|LOW|SLAMMED|STANCE|QUATTRO|XDRIVE|4MATIC|AWD|RWD'), { confidence:82, collectorNotes:'Performance arba tiuningo terminas gali būti atpažįstamas automobilių kultūroje.', tags:['performance','automotive'] });
addMany('motorsport','series', words('F1|WRC|WEC|DTM|BTCC|WTCR|NASCAR|INDYCAR|DAKAR|LEMANS|NURBURGRING|NORDSCHLEIFE|MONZA|SPA|SUZUKA|IMOLA|GOODWOOD|RALLY|RALLYCROSS|DRAG|DRIFTMASTERS|FORMULAD|MOTOGP|WSBK'), { confidence:82, collectorNotes:'Autosporto pavadinimas ar trasa gali būti stipri entuziastų asociacija.', tags:['motorsport','racing'] });
addMany('trucks','truck', words('SCANIA|VOLVOFH|VOLVOFM|MAN|DAF|IVECO|RENAULTTRUCKS|MERCEDESACTROS|ACTROS|ATEGO|SPRINTER|CRAFTER|TRANSIT|DUCATO|DAILY|FH16|XF|TGX|TGS|TRX'), { confidence:78, collectorNotes:'Komercinio transporto ar sunkvežimio motyvas gali būti aktualus vairuotojams ir verslui.', tags:['truck','commercial'] });

const ltNames = words('AARONAS|ADAMAS|ADRIANAS|AIDAS|AIMANTAS|AINIUS|ALANAS|ALBERTAS|ALEKSANDRAS|ALGIRDAS|ANDRIUS|ANTANAS|ARAS|ARNAS|ARNOLDAS|ARONAS|ARTURAS|ARUNAS|AUDRIUS|AUGUSTAS|AURELIJUS|AZUOLAS|BENAS|BENEDIKTAS|DANIELIUS|DARIUS|DAUMANTAS|DEIMANTAS|DEIVIDAS|DOMANTAS|DOMAS|DONATAS|DOVYDAS|EDGARAS|EDVINAS|EIMANTAS|ELIJUS|EMILIS|ERNESTAS|EVALDAS|GABRIELIUS|GEDIMINAS|GIEDRIUS|GINTARAS|GUSTAS|HERKUS|IGNAS|JOKUBAS|JONAS|JORIS|JUOZAS|JUSTAS|KAROLIS|KASTYTIS|KAZYS|KIPRAS|KRISTIJONAS|LAIMONAS|LAURYNAS|LEONAS|LINAS|LIUDAS|LUKAS|MANTAS|MARIUS|MARTYNAS|MATAS|MINDAUGAS|MODESTAS|MOTIEJUS|NERIJUS|NOJUS|OSKARAS|PAULIUS|PETRAS|POVILAS|RAMUNAS|RAULAS|RIMAS|ROKAS|ROLANDAS|SAULIUS|SIMAS|TADAS|TITAS|TOMAS|UGNIUS|VAIDAS|VAKARIS|VALDAS|VIKTORAS|VILIUS|VINCAS|VYTAUTAS|ZYGIMANTAS|ADELE|AGNE|AISTE|AKVILE|ALDONA|ALEKSANDRA|ALINA|AMELIJA|ANA|AUSTEJA|BARBORA|BEATA|BRIGITA|DAIVA|DANUTE|DEIMANTE|DIANA|DOMINIKA|EDITA|EGLE|EMA|EMILIJA|ERIKA|EVELINA|GABIJA|GABRIELE|GERDA|GIEDRE|GINTARE|GRETA|IEVA|ILONA|INGA|INGRIDA|IRENA|IZABELE|JOLANTA|JUSTE|KAMILA|KAROLINA|KATERINA|KOTRYNA|KRISTINA|LAIMA|LAURA|LIEPA|LINA|LUKA|MARIJA|MARTA|MIGLE|MILDA|MONIKA|NEDA|NERINGA|PAULINA|RASA|RITA|RUGILE|RUTA|SAULE|SIGITA|SIMONA|SOFIJA|UGNE|URTE|VAIDA|VAKARE|VIKTORIJA|VILTE|ZIVILE');
for (const name of ltNames) {
  const leetName = name.replace(/O/g,'0').replace(/A/g,'4').replace(/S/g,'5').replace(/I/g,'1').replace(/T/g,'7');
  add('lithuanian-names','given-name', name, name, { language:'lt', country:'LT', confidence:88, aliases:[leetName], collectorNotes:`${name} yra lietuviškas vardas, todėl derinys gali būti vardinis.`, tags:['name','person'] });
  if (leetName !== name) add('nicknames','hidden-lt-name', leetName, name, { language:'lt', country:'LT', confidence:82, relatedKeywords:[name], collectorNotes:`${leetName} gali būti vizualiai perskaitoma kaip vardas ${name}.`, tags:['hidden-name','leet','name'] });
  if (name.length >= 5) add('nicknames','lt-short-name', name.slice(0,4), name.slice(0,4), { language:'lt', country:'LT', confidence:64, relatedKeywords:[name], collectorNotes:'Trumpinys gali priminti vardą arba pravardę.', tags:['nickname','name'] });
  if (name.length >= 5) add('nicknames','lt-diminutive', `${name.slice(0,4)}UKAS`, `${name.slice(0,4)}ukas`, { language:'lt', country:'LT', confidence:68, relatedKeywords:[name], collectorNotes:'Diminutyvas arba pravardė gali būti asmeniškai reikšminga.', tags:['nickname','name'] });
}
const enNames = words('JAMES|JOHN|ROBERT|MICHAEL|WILLIAM|DAVID|RICHARD|JOSEPH|THOMAS|CHARLES|CHRISTOPHER|DANIEL|MATTHEW|ANTHONY|MARK|DONALD|STEVEN|PAUL|ANDREW|JOSHUA|KENNETH|KEVIN|BRIAN|GEORGE|TIMOTHY|RONALD|JASON|EDWARD|JEFFREY|RYAN|JACOB|GARY|NICHOLAS|ERIC|JONATHAN|STEPHEN|LARRY|JUSTIN|SCOTT|BRANDON|BENJAMIN|SAMUEL|GREGORY|FRANK|ALEXANDER|PATRICK|RAYMOND|JACK|DENNIS|JERRY|TYLER|AARON|ADAM|HENRY|NATHAN|DOUGLAS|ZACHARY|PETER|KYLE|ETHAN|NOAH|LIAM|OLIVER|ELIJAH|LUCAS|MASON|LOGAN|MARY|PATRICIA|JENNIFER|LINDA|ELIZABETH|BARBARA|SUSAN|JESSICA|SARAH|KAREN|NANCY|LISA|BETTY|MARGARET|SANDRA|ASHLEY|KIMBERLY|EMILY|DONNA|MICHELLE|CAROL|AMANDA|MELISSA|DEBORAH|STEPHANIE|REBECCA|LAURA|SHARON|CYNTHIA|KATHLEEN|AMY|ANGELA|HELEN|ANNA|BRENDA|PAMELA|NICOLE|SAMANTHA|KATHERINE|EMMA|RUTH|CHRISTINE|CATHERINE|DEBRA|RACHEL|CAROLYN|JANET|MARIA|HEATHER|DIANE|JULIE|JOYCE|VICTORIA|KELLY|CHRISTINA|JOAN|EVELYN|LAUREN|JUDITH|MEGAN|CHERYL|HANNAH|OLIVIA|SOPHIA|ISABELLA|AVA|MIA');
for (const name of enNames) {
  const leetName = name.replace(/O/g,'0').replace(/A/g,'4').replace(/S/g,'5').replace(/I/g,'1').replace(/T/g,'7').replace(/E/g,'3');
  add('english-names','given-name', name, name, { language:'en', confidence:82, aliases:[leetName], collectorNotes:`${name} yra angliškas vardas, todėl gali būti vardinis arba tarptautinis derinys.`, tags:['name','person'] });
  if (leetName !== name) add('nicknames','hidden-en-name', leetName, name, { language:'en', confidence:76, relatedKeywords:[name], collectorNotes:`${leetName} gali būti vizualiai perskaitoma kaip vardas ${name}.`, tags:['hidden-name','leet','name'] });
  if (name.length >= 5) add('nicknames','en-short-name', name.slice(0,4), name.slice(0,4), { language:'en', confidence:58, relatedKeywords:[name], collectorNotes:'Trumpinys gali priminti anglišką vardą arba pravardę.', tags:['nickname','name'] });
}

const compactGroups = [
  ['people','roles','KING|QUEEN|BOSS|GOD|HERO|STAR|LEGEND|CHAMP|PRO|VIP|CEO|DJ|DR|MR|MRS|SIR|LORD|DUKE'],
  ['famous-people','icons','SENNA|SCHUMACHER|HAMILTON|VERSTAPPEN|VETTEL|ALONSO|RAIKKONEN|LAUDA|PROST|FANGIO|MCLAREN|ENZO|FERRUCCIO|SHELBY|KENBLOCK'],
  ['drivers','drivers','SENNA|SCHUMI|HAM44|MAX33|VER1|ALO14|KIMI|VET5|LEC16|SAI55|NOR4|PIA81|BOT77|ROSBERG|HAKKINEN|MASSA'],
  ['athletes','athletes','JORDAN|KOBE|LEBRON|MESSI|RONALDO|NEYMAR|MBAPPE|FEDERER|NADAL|DJOKOVIC|SABONIS|MARCIULIONIS|VALANCIUNAS'],
  ['musicians','musicians','DRAKE|EMINEM|TUPAC|PAC|BIGGIE|YE|KANYE|METALLICA|QUEEN|ABBA|BOWIE|ELVIS|MJ|MADONNA|BEYONCE|RIHANNA'],
  ['cities','lithuanian-city','VILNIUS|KAUNAS|KLAIPEDA|SIAULIAI|PANEVEZYS|ALYTUS|MARIJAMPOLE|MAZEIKIAI|JONAVA|UTENA|KEDAINIAI|TAURAGE|TELSIAI|VISAGINAS|PLUNGE|KRETINGA|PALANGA|SILUTE|RADVILISKIS|GARGZDAI|DRUSKININKAI|ROKISKIS|BIRZAI|ELEKTRENAI|KURSENAI|GARLIAVA|JURBARKAS|VILKAVISKIS|RASEINIAI|ANYKSCIAI|LENTVARIS|GRIGISKES|PRIEKULE|KELME|VARENA|KAISIADORYS|PASVALYS|KUPISKIS|ZARASAI|SKUODAS|IGNALINA|SAKIAI|MOLETAI|SIRVINTOS|SALCININKAI|SILALE|AKMENE|NAUJOJIAKMENE|PAKRUOJIS|LAZDIJAI|KALVARIJA|BIRSTONAS|NERINGA'],
  ['countries','country','LIETUVA|LITHUANIA|LT|LATVIA|LV|ESTONIA|EE|POLAND|PL|GERMANY|DE|SWEDEN|SE|NORWAY|NO|FINLAND|FI|DENMARK|DK|ITALY|IT|FRANCE|FR|SPAIN|ES|USA|UK|JAPAN|JP|KOREA|KR'],
  ['airports','airport-code','VNO|KUN|PLQ|RIX|TLL|WAW|BER|FRA|MUC|CPH|ARN|OSL|HEL|LHR|STN|LTN|CDG|ORY|AMS|BRU|MAD|BCN|FCO|MXP|JFK|LAX|DXB|DOH|HND|NRT'],
  ['roads','road','A1|A2|A3|A5|A6|A7|A8|A9|A10|A11|A12|A13|VIABALTICA|E67|E85|E272|AUTOBAHN|ROUTE66'],
  ['villages','lt-place','TRAKAI|RUMSISKES|NIDA|JUODKRANTE|VENTE|KERNAVE|KINTAI|MINGE|DUBINGIAI|MERKINE|PUNSKAS'],
  ['places','generic-place','HOME|CITY|VILLAGE|BEACH|FOREST|LAKE|SEA|MOUNTAIN|ROAD|GARAGE|TRACK|PADDOCK'],
  ['luxury-watches','watch-brand','ROLEX|PATEK|PATEKPHILIPPE|AP|AUDEMARSPIGUET|RICHARDMILLE|RM|OMEGA|TAGHEUER|CARTIER|BREITLING|IWC|PANERAI|HUBLOT|ZENITH|TUDOR|SEIKO|GRANDSEIKO|DAYTONA|SUBMARINER|GMTMASTER|NAUTILUS|ROYALOAK|SPEEDMASTER'],
  ['fashion','fashion-brand','LOUISVUITTON|LV|GUCCI|PRADA|HERMES|DIOR|CARTIER|CHANEL|VERSACE|ARMANI|BALENCIAGA|BURBERRY|FENDI|MONCLER|OFFWHITE|SUPREME|NIKE|ADIDAS|PUMA|JORDAN'],
  ['luxury','luxury-word','LUX|VIP|TOP|ELITE|PREMIUM|ROYAL|GOLD|PLATINUM|DIAMOND|BLACK|WHITE|RED|BLUE|SILVER|CARBON|LIMITED|RARE|ONEOFONE|BESPOKE'],
  ['technology','technology','RTX|GTX|AI|GPT|CPU|GPU|PS5|XBOX|M4|I9|RYZEN|INTEL|AMD|NVIDIA|APPLE|MAC|IPHONE|ANDROID|CYBER|CODE|DEV|DATA|CLOUD|SERVER|LINUX|WINDOWS|USB|SSD|OLED|4K|8K'],
  ['gaming','gaming','CS2|CSGO|GTA|GTAV|GTA6|LOL|WOW|COD|FIFA|EAFC|MINECRAFT|FORTNITE|VALORANT|DOTA|PUBG|ROBLOX|APEX|HALO|ZELDA|MARIO|SONIC|POKEMON|NFS|FORZA|GRANTURISMO|ASSETTO|IRACING'],
  ['brands','popular-brand','APPLE|GOOGLE|TESLA|NIKE|ADIDAS|SONY|SAMSUNG|MICROSOFT|AMAZON|META|NETFLIX|SPOTIFY|REDBULL|MONSTER|COCACOLA|PEPSI|STARBUCKS|MCDONALDS'],
  ['food','food','PIZZA|SUSHI|BURGER|KEBAB|TACO|STEAK|BBQ|COFFEE|ESPRESSO|LATTE|DONUT|CAKE|HONEY|CHILI|WASABI'],
  ['business','business','CEO|BOSS|FOUNDER|STARTUP|AGENCY|STUDIO|GROUP|HOLDING|CAPITAL|VENTURE|TRADE|MARKET|SALES|DEAL|CASH|PROFIT|EXPORT|IMPORT|LOGISTICS'],
  ['finance','finance','EUR|USD|BTC|ETH|SOL|DOGE|NFT|BANK|FIN|INVEST|STOCK|BULL|BEAR|MOON|WHALE|CRYPTO|IBAN'],
  ['sports','sports','NBA|NFL|F1|UFC|MMA|FIFA|UEFA|LKL|EUROLEAGUE|ZALGIRIS|RYTAS|BARCA|REAL|LFC|MUFC|GOAL|MVP|CHAMP|ULTRA'],
  ['music','music','DJ|BASS|BEAT|RAP|ROCK|METAL|POP|JAZZ|TECHNO|HOUSE|TRAP|VINYL|STAGE|MIC|VOCAL|BAND'],
  ['internet','internet','LOL|OMG|WTF|GG|EZ|NOOB|PRO|MEME|VIRAL|LIKE|SUB|FOLLOW|STREAM|CHAT|DM|PM|IRL|AFK|BRB|BTW'],
  ['common-words','word','FAST|POWER|KING|QUEEN|GOD|BOSS|TOP|VIP|LOVE|LUCK|HAPPY|SMILE|DREAM|FIRE|ICE|SUN|MOON|STAR|SKY|WILD|FREE|NICE|COOL|GOOD|BEST|YES|NO|OK|GO|RUN|FLY'],
  ['slang','slang','PACAN|BAZAR|KRUTAS|LEDAS|GERAS|VAROM|GAZAS|GAZU|BROLIS|SEFAS|KENTAS|MALAC|DRIFTAS|TUSAS|FYFA'],
  ['abbreviations','abbr','LT|EU|USA|UK|VIP|CEO|DJ|DR|MR|MRS|FBI|CIA|NASA|NATO|UN|IT|HR|PR|QA|UX|UI|SEO|API|SQL|PDF'],
  ['roman-numerals','roman','I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XX|XL|L|C|D|M'],
  ['chemical-elements','element','H|HE|LI|BE|B|C|N|O|F|NE|NA|MG|AL|SI|P|S|CL|AR|K|CA|FE|CU|ZN|AG|AU|PT|PD|HG|PB|U'],
  ['greek-letters','greek','ALPHA|BETA|GAMMA|DELTA|EPSILON|ZETA|ETA|THETA|IOTA|KAPPA|LAMBDA|OMEGA|SIGMA|PHI|PI'],
  ['latin-words','latin','REX|LUX|VITA|AMOR|FORTIS|MAGNUS|NOVA|VERITAS|VICTOR|AQUILA|IGNIS|SOL|LUNA|PAX'],
  ['religion','religion','ANGEL|SAINT|AMEN|CROSS|FAITH|HOPE|DEUS|DIEVAS|KRISTUS|MARY|MARIA'],
  ['history','history','VYTIS|GEDIMINAS|MINDAUGAS|VYTAUTAS|TRAKAI|ROMA|SPARTA|VIKING|KNIGHT|LEGION|EMPIRE'],
  ['mythology','mythology','ZEUS|HERA|ARES|ATHENA|APOLLO|ODIN|THOR|LOKI|FREYA|PERKUNAS|AUSRA|PEGASUS|PHOENIX'],
  ['animals','animal','LION|TIGER|WOLF|BEAR|FOX|EAGLE|HAWK|SHARK|BULL|HORSE|DRAGON|PANTHER|JAGUAR|VIPER|COBRA'],
  ['birds','bird','EAGLE|HAWK|FALCON|RAVEN|CROW|SWAN|OWL|STORK|GANDRAS|ERELIS|SAKALAS'],
  ['fish','fish','SHARK|TUNA|SALMON|CARP|LYDEKA|ESERYS|KAROSAS|UNGURYS'],
  ['dogs','dog','DOG|K9|HUSKY|AKITA|CORGI|PITBULL|DOBERMAN|ROTTWEILER|LABRADOR|BULLDOG'],
  ['cats','cat','CAT|KAT|LION|TIGER|PUMA|LYNX|LEOPARD|PANTHER|JAGUAR'],
  ['aviation','aviation','JET|AIR|PILOT|BOEING|AIRBUS|A320|A330|A350|A380|B737|B747|B777|B787|F16|F18|F22|F35|MIG|SU27|AN2'],
  ['military','military','TANK|ARMY|NAVY|AIRFORCE|NATO|AK47|M4|M16|SNIPER|RANGER|DELTA|BRAVO|ALPHA'],
  ['ships','ships','YACHT|BOAT|SHIP|SAIL|MARINA|CAPTAIN|ANCHOR|AZIMUT|SUNSEEKER|PRINCESS'],
  ['space','space','NASA|SPACEX|STAR|MOON|MARS|VENUS|ORION|APOLLO|ROCKET|FALCON9|SATURN|JUPITER|COSMOS'],
  ['movies','movies','BATMAN|JOKER|BOND|007|MATRIX|NEO|MARVEL|DC|AVATAR|ROCKY|RAMBO|TERMINATOR|ALIEN|PREDATOR|FASTFURIOUS'],
  ['tv','tv','HBO|NETFLIX|DISNEY|PRIME|TOPGEAR|GRANDTOUR|BREAKINGBAD|GOT|HOUSE|DEXTER|FRIENDS|OFFICE'],
  ['anime','anime','NARUTO|SASUKE|GOKU|VEGETA|DRAGONBALL|ONEPIECE|LUFFY|DEATHNOTE|AKIRA|EVANGELION|DEMONSLAYER'],
  ['games','games-general','CHESS|POKER|DICE|ACE|KING|QUEEN|JOKER|BLACKJACK|ROULETTE|MONOPOLY'],
  ['alcohol','alcohol','WHISKY|WHISKEY|VODKA|GIN|RUM|TEQUILA|BEER|WINE|CHAMPAGNE|MOET|HENNESSY|JACKDANIELS|JAGER'],
  ['cigars','cigars','CIGAR|CUBAN|COHIBA|MONTECRISTO|ROMEO|JULIETA|PARTAGAS'],
  ['boats','boats','YAMAHAJET|SEADOO|BAYLINER|AZIMUT|SUNSEEKER|PRINCESS|RIVA|BENETEAU|JEANNEAU'],
  ['bikes','bikes','TREK|GIANT|SPECIALIZED|CANYON|SCOTT|CUBE|BMC|PINARELLO|CERVELO|SANTACRUZ|BMX|MTB'],
  ['tools','tools','MAKITA|DEWALT|BOSCH|MILWAUKEE|HILTI|FESTOOL|STIHL|HUSQVARNA|SNAPON|WERA|KNIPEX'],
  ['construction','construction','BUILD|HOUSE|HOME|ROOF|CRANE|CAT|JCB|BOBCAT|KOMATSU|HITACHI|DOOSAN|LIEBHERR'],
  ['agriculture','agriculture','JOHNDEERE|DEERE|FENDT|CLAAS|CASE|NEWHOLLAND|VALTRA|MASSEY|TRACTOR|FARM|HARVEST'],
  ['universities','universities','VU|KTU|VDU|VGTU|VILNIUSTECH|LSMU|MRU|ISM|HARVARD|MIT|OXFORD|CAMBRIDGE|STANFORD'],
  ['government','government','LTU|LRS|VRM|KAM|SAM|VMI|SODRA|REGITRA|POLICIJA|POLICE|EU|NATO'],
  ['emergency','emergency','SOS|112|911|EMS|FIRE|RESCUE|POLICE|AMBULANCE|MEDIC|PARAMEDIC'],
  ['medical','medical','DOC|DR|MD|RN|ER|ICU|MED|DENT|ORTHO|CARDIO|NEURO|SURG'],
  ['science','science','ATOM|QUANTUM|PHYSICS|BIO|CHEM|MATH|LAB|DNA|RNA|LASER|NANO|ROBOT'],
  ['weather','weather','SUN|RAIN|SNOW|STORM|WIND|FOG|ICE|CLOUD|THUNDER|LIGHTNING|AURORA'],
  ['nature','nature','FOREST|LAKE|SEA|RIVER|MOUNTAIN|HILL|STONE|FIRE|WATER|EARTH|WIND|NATURE|TREE|OAK|PINE'],
];
for (const [category, subcategory, list] of compactGroups) addMany(category, subcategory, words(list), { confidence:70, collectorNotes:'Ši reikšmė gali būti atpažįstama kaip kultūrinė, asmeninė arba bendruomenės asociacija.', tags:[category] });

for (const category of categories) {
  const dir = path.join(root, category);
  fs.mkdirSync(dir, { recursive: true });
  const constName = `${category.replace(/-/g, '_').toUpperCase()}_ENTRIES`;
  fs.writeFileSync(
    path.join(dir, 'index.ts'),
    `import { defineKnowledgeEntries } from '../schema';\n\nexport const ${constName} = defineKnowledgeEntries(${JSON.stringify(entriesByCategory[category], null, 2)});\n`,
    'utf8',
  );
}

const imports = categories.map((category) => `import { ${category.replace(/-/g, '_').toUpperCase()}_ENTRIES } from './${category}';`).join('\n');
const packs = categories.map((category) => `  { category: '${category}', entries: ${category.replace(/-/g, '_').toUpperCase()}_ENTRIES },`).join('\n');
fs.writeFileSync(path.join(root, 'category-packs.ts'), `${imports}\nimport type { KnowledgeCategoryPack } from './schema';\n\nexport const KNOWLEDGE_CATEGORY_PACKS = [\n${packs}\n] as const satisfies readonly KnowledgeCategoryPack[];\n`, 'utf8');

const total = Object.values(entriesByCategory).reduce((sum, entries) => sum + entries.length, 0);
console.log(`Generated ${total} database entries in ${categories.length} categories.`);
