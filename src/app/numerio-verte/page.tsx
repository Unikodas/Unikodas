import Link from 'next/link';
import type { Metadata } from 'next';

import { FaqAccordion } from '@/components/FaqAccordion';
import { JsonLd } from '@/components/JsonLd';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { createPageMetadata } from '@/lib/seo';
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { createClient } from '@/lib/supabase/server';
import type { FlagType, PlateType } from '@/lib/validation/listing';

const LIVE_LISTINGS_LIMIT = 6;
const TELEGRAM_URL = 'https://t.me/+xweru-k3heRlMjY0';

export const metadata: Metadata = createPageMetadata({
  title: 'Automobilio numerio vertė | Kaip įvertinti numerį? | Unikodas',
  description:
    'Sužinokite, kas lemia automobilio numerio vertę. Analizuokite numerį, atraskite paslėptas reikšmes ir sužinokite, kodėl vieni numeriai vertinami labiau nei kiti.',
  path: '/numerio-verte',
  keywords: [
    'numerio vertė',
    'kiek vertas mano numeris',
    'automobilio numerio vertė',
    'kaip įvertinti numerį',
    'numerio kaina',
  ],
});

const valueFactors = [
  {
    icon: 'Aa',
    title: 'Vardai ir žodžiai',
    text: 'Numeriai, kuriuos galima perskaityti kaip vardą, inicialus ar aiškų žodį, dažnai tampa patrauklesni konkrečiam pirkėjui. Vertė čia gimsta iš asmeninės reikšmės: M4T45 gali priminti MATAS, DOM455 - DOMAS, o trumpas verslo pavadinimas gali būti įdomus įmonei.',
  },
  {
    icon: 'M',
    title: 'Automobilių modeliai',
    text: 'Deriniai, primenantys BMW, AMG, RS, GT3, SVJ ar kitus automobilių pasaulio ženklus, gali būti įdomūs entuziastams. BMW530 aiškiai kalba BMW 5 serijos savininkams, o SVJ gali priminti Lamborghini Aventador SVJ, bet tokios asociacijos visada priklauso nuo pirkėjo.',
  },
  {
    icon: '123',
    title: 'Trumpi deriniai',
    text: 'Trumpas numeris dažnai atrodo švaresnis, lengviau įsimenamas ir geriau tinka tiek privačiam automobiliui, tiek verslo transportui. Vis dėlto trumpumas pats savaime negarantuoja kainos: svarbu, ar derinys turi aiškią reikšmę ir ar yra žmogus, kuriam ji aktuali.',
  },
  {
    icon: '777',
    title: 'Pasikartojantys skaičiai',
    text: '111, 333, 777 ar 999 yra lengvai pastebimi ir greitai įsimenami. Tokie skaičiai dažnai atrodo tvarkingai, todėl kolekcininkams gali patikti labiau nei atsitiktinis skaičių rinkinys.',
  },
  {
    icon: 'OK',
    title: 'Lengvas įsiminimas',
    text: 'Jeigu numerį galima pasakyti telefonu, prisiminti po vieno žvilgsnio arba greitai atpažinti aikštelėje, jis turi praktinį privalumą. Lengvai įsimenamas derinys nebūtinai brangus, bet jis turi platesnę auditoriją.',
  },
  {
    icon: 'LT',
    title: 'Simboliai',
    text: 'ES simbolis, Vytis, Lietuvos vėliava ar istorinis formatas gali pakeisti vizualų įspūdį. Vieniems pirkėjams svarbiausia modernus ES stilius, kiti ieško tautinio akcento arba konkretaus laikotarpio estetikos.',
  },
  {
    icon: 'C',
    title: 'Kolekcinis patrauklumas',
    text: 'Kolekcinis numeris paprastai turi aiškų motyvą: simetriją, pasikartojimą, vardą, modelio nuorodą, retą skaičių seką arba estetiškai švarų vaizdą. Kolekcininkams svarbu ne vien kaina, bet ir istorija, kurią galima papasakoti apie derinį.',
  },
  {
    icon: '1/1',
    title: 'Unikalumas ir paklausa',
    text: 'Numerio vertę galiausiai lemia ne tik pats derinys, bet ir paklausa. Jeigu kombinacija unikali, bet niekam neaktuali, kaina gali būti kukli. Jeigu ji tiksliai atitinka pirkėjo vardą, automobilį ar verslą, derybos gali atrodyti visai kitaip.',
  },
];

const examples = [
  {
    plate: 'BMW530',
    type: 'standard' as PlateType,
    flag: 'eu_symbol' as FlagType,
    title: 'BMW modelio asociacija',
    text: 'BMW530 aiškiai jungia BMW prekės ženklą ir 530 modelio nuorodą. Toks derinys gali būti patrauklus BMW 5 serijos savininkui, nes numeris dera su automobilio identitetu ir lengvai paaiškinamas kitiems entuziastams.',
  },
  {
    plate: 'DOM455',
    type: 'personalized' as PlateType,
    flag: 'eu_symbol' as FlagType,
    title: 'Paslėptas vardas',
    text: 'DOM455 iš pirmo žvilgsnio atrodo kaip paprastas raidžių ir skaičių derinys, bet 4 gali priminti A, o 5 - S. Dėl to jis gali būti skaitomas kaip DOMAS ir tapti įdomus žmogui, kuriam šis vardas svarbus.',
  },
  {
    plate: 'VIP777',
    type: 'personalized' as PlateType,
    flag: 'eu_symbol' as FlagType,
    title: 'Įsimenamas statuso motyvas',
    text: 'VIP yra trumpas ir aiškus žodis, o 777 dažnai siejamas su sėkme ir pasikartojančiu, tvarkingu raštu. Tokį numerį lengva prisiminti, todėl jis gali patikti tiems, kurie nori ryškaus, bet suprantamo derinio.',
  },
  {
    plate: 'SVJ061',
    type: 'personalized' as PlateType,
    flag: 'eu_symbol' as FlagType,
    title: 'Superautomobilio nuoroda',
    text: 'SVJ automobilių entuziastams gali priminti Lamborghini Aventador SVJ. Skaičiai 061 nėra tokie stiprūs kaip pati SVJ dalis, tačiau jie gali suteikti papildomą stilizuotą modelio ar serijos motyvą.',
  },
  {
    plate: 'AAA111',
    type: 'standard' as PlateType,
    flag: 'eu_symbol' as FlagType,
    title: 'Pasikartojimas ir simetrija',
    text: 'AAA111 turi trigubas raides ir trigubus skaičius. Švarus pasikartojimas padeda numeriui atrodyti tvarkingai, lengvai įsiminti ir išsiskirti iš atsitiktinių kombinacijų.',
  },
];

const myths = [
  {
    title: 'Ar senas numeris visada vertingas?',
    text: 'Ne visada. Senesnis formatas gali turėti nostalgijos ar kolekcinį atspalvį, bet vertę lemia ir derinio aiškumas, paklausa, būklė, galimybė jį perregistruoti ir pirkėjo motyvacija.',
  },
  {
    title: 'Ar visi vardiniai numeriai brangūs?',
    text: 'Ne. Vardinis numeris vertingas tada, kai yra pakankamai aiškus ir turi auditoriją. Retas vardas gali būti labai svarbus vienam žmogui, bet mažiau įdomus plačiai rinkai.',
  },
  {
    title: 'Ar trigubi skaičiai visada brangūs?',
    text: 'Trigubi skaičiai dažnai atrodo patraukliai, bet kaina priklauso nuo viso derinio. VIP777 ar AAA111 turi aiškesnį motyvą nei atsitiktinės raidės su 777, todėl vertinimas turi būti platesnis.',
  },
  {
    title: 'Ar galima tiksliai apskaičiuoti kainą?',
    text: 'Tikslios formulės nėra. Numerio kaina yra derybų rezultatas tarp pardavėjo ir pirkėjo. Analizė gali parodyti stiprybes, bet negali garantuoti rinkos kainos.',
  },
];

const helpItems = [
  {
    title: 'Analizė',
    text: 'Unikodas įžvalgos padeda pamatyti raštus, paslėptus vardus, automobilių modelių asociacijas, pasikartojimus ir kitus požymius, kuriuos lengva praleisti žiūrint į numerį pirmą kartą.',
  },
  {
    title: 'Prekyvietė',
    text: 'Jeigu numeris atrodo įdomus, galite įkelti skelbimą, nurodyti miestą, kainą, aprašymą ir leisti pirkėjams jus surasti. Kontaktas vyksta per vidines žinutes, todėl telefono numerių viešinti nereikia.',
  },
  {
    title: 'Bendruomenė',
    text: 'Automobilių entuziastai dažnai pastebi niuansus, kurių algoritmas dar nemato. Telegram bendruomenėje galite parodyti derinį ir gauti gyvų žmonių įžvalgų.',
  },
  {
    title: 'Ateities rinkos įžvalgos',
    text: 'Ateityje Unikodas planuoja remtis realiais skelbimų, peržiūrų ir rinkos aktyvumo duomenimis. Tai nėra pažadas dėl datos, bet kryptis aiški: daugiau duomenų, mažiau spėlionių.',
  },
];

const faqs = [
  {
    question: 'Kaip nustatyti numerio vertę?',
    answer:
      'Pradėkite nuo derinio analizės: ar numeris trumpas, ar turi vardą, žodį, automobilių modelio nuorodą, pasikartojančius skaičius, simetriją ar lengvai įsimenamą struktūrą. Tada palyginkite panašius skelbimus ir įvertinkite, kam toks numeris galėtų būti aktualus. Galutinė vertė priklauso nuo paklausos ir konkretaus pirkėjo.',
  },
  {
    question: 'Ar Unikodas nustato kainą?',
    answer:
      'Ne. Unikodas gali padėti suprasti, kodėl numeris gali būti įdomus, bet nenustato oficialios kainos ir negarantuoja rinkos vertės. Kainą pasirenka pardavėjas, o galutinė suma priklauso nuo derybų su pirkėju.',
  },
  {
    question: 'Kas daro numerį vertingu?',
    answer:
      'Dažniausiai vertę didina aiški reikšmė, trumpumas, retumas, lengvas įsiminimas, pasikartojantys skaičiai, vardas, verslo ar automobilio modelio asociacija. Tačiau net stiprus derinys turi turėti pirkėją, kuriam jis iš tikrųjų aktualus.',
  },
  {
    question: 'Ar vardiniai numeriai visada brangesni?',
    answer:
      'Ne visada. Vardinis numeris gali būti patrauklus žmogui su tuo vardu, bet platesnėje rinkoje jo paklausa gali būti ribota. Kuo vardas trumpesnis, aiškesnis ir dažnesnis, tuo lengviau rasti potencialų pirkėją.',
  },
  {
    question: 'Ar numerio vertė priklauso nuo automobilio?',
    answer:
      'Pats numeris gali būti parduodamas atskirai nuo konkretaus automobilio situacijos, tačiau asociacija su automobilio modeliu gali turėti įtakos paklausai. BMW530 labiau kalba BMW 530 savininkui nei žmogui, vairuojančiam visai kitą modelį.',
  },
  {
    question: 'Kaip parduoti numerį?',
    answer:
      'Sukurkite skelbimą, aiškiai nurodykite numerį, miestą, kainą ir aprašymą. Jei derinys turi reikšmę, paaiškinkite ją skelbime. Su pirkėju bendraukite per vidines žinutes, o formalumus tvarkykite atsakingai pagal galiojančią tvarką.',
  },
  {
    question: 'Ar galima rezervuoti numerį?',
    answer:
      'Rezervavimo ir perregistravimo taisyklės priklauso nuo oficialios tvarkos, todėl prieš priimdami sprendimus pasitikrinkite aktualią informaciją Regitroje. Unikodas nėra registravimo institucija ir nepakeičia oficialių šaltinių.',
  },
  {
    question: 'Kas yra kolekcinis numeris?',
    answer:
      'Kolekcinis numeris paprastai turi aiškų, retą arba estetiškai stiprų motyvą: trigubus simbolius, simetriją, modelio nuorodą, vardą, legendinį automobilių terminą ar kitą reikšmę, kuri patinka entuziastams.',
  },
  {
    question: 'Ar Vytis didina vertę?',
    answer:
      'Vytis gali padidinti vizualinį ir emocinį patrauklumą pirkėjui, kuriam svarbus lietuviškas simbolis. Tačiau pats simbolis negarantuoja didesnės kainos: svarbus ir numerio tekstas, paklausa bei bendra kombinacija.',
  },
  {
    question: 'Kaip rasti pirkėją?',
    answer:
      'Padėkite pirkėjui suprasti numerio istoriją. Skelbime paminėkite, ar derinys primena vardą, automobilio modelį, žodį, datą ar simbolį. Taip pat naudokite Unikodas prekyvietę, dalinkitės skelbimu ir gaukite bendruomenės nuomonę.',
  },
  {
    question: 'Ar gražus numeris visada greitai parduodamas?',
    answer:
      'Ne. Net patrauklus numeris gali laukti tinkamo pirkėjo. Greitį lemia kaina, auditorijos dydis, derinio aiškumas, skelbimo aprašymas ir tai, ar numeris pasiekia žmones, kuriems jis turi reikšmę.',
  },
  {
    question: 'Ar numerio analizė pakeičia profesionalų vertinimą?',
    answer:
      'Ne. Analizė yra pagalbinė priemonė, kuri padeda pastebėti stipriąsias derinio savybes. Ji nėra oficialus vertinimas, teisinė konsultacija ar garantuota rinkos kaina.',
  },
];

const internalLinks = [
  { href: '/', label: 'Naršyti numerius', text: 'Peržiūrėkite aktyvius skelbimus Unikodas prekyvietėje.' },
  { href: '/numerio-analize', label: 'Analizuoti numerį', text: 'Patikrinkite paslėptas reikšmes, raštus ir asociacijas.' },
  { href: '/idomiausi-numeriai', label: 'Įdomiausi numeriai', text: 'Atraskite stipriausiai įvertintus derinius.' },
  { href: '/kaip-parduoti-numeri', label: 'Kaip parduoti', text: 'Sužinokite saugaus pardavimo eigą.' },
  { href: '/vardiniai-numeriai', label: 'Vardiniai numeriai', text: 'Naršykite vardinius ir personalizuotus derinius.' },
  { href: '/motociklu-numeriai', label: 'Motociklų numeriai', text: 'Peržiūrėkite motociklų numerių kategoriją.' },
  { href: '/parduoti', label: 'Parduoti numerį', text: 'Įkelkite savo numerio skelbimą.' },
];

export default async function PlateValuePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(LIVE_LISTINGS_LIMIT);

  if (error) {
    console.error('[numerio-verte] listings query failed:', error);
  }

  const listings = (data ?? []) as ListingCardData[];
  const isSignedIn = Boolean(userData.user);

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: 'Kiek gali būti vertas jūsų automobilio numeris?',
            description:
              'Išsamus gidas apie automobilio numerio vertę, paslėptas reikšmes, kolekcinį patrauklumą ir saugų pardavimą per Unikodas.',
            path: '/numerio-verte',
          }),
          faqPageJsonLd(faqs),
          breadcrumbJsonLd([
            { name: 'Numeriai', path: '/' },
            { name: 'Numerio vertė', path: '/numerio-verte' },
          ]),
          itemListJsonLd({
            name: 'Aktyvūs numerių skelbimai',
            path: '/numerio-verte',
            listings,
          }),
        ]}
      />

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <LogoLink />
          <Link
            href="/numerio-analize"
            className="hidden rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] sm:inline-flex"
          >
            Analizuoti numerį
          </Link>
        </nav>
      </header>

      <main className="app-shell">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <section className="app-card grid gap-7 overflow-hidden p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase text-[var(--primary)]">
                Numerio vertė
              </p>
              <h1 className="mt-3 max-w-4xl text-[clamp(2rem,9vw,4rem)] font-black leading-tight text-[var(--foreground)]">
                Kiek gali būti vertas jūsų automobilio numeris?
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                Numerio vertė priklauso ne tik nuo raidžių ir skaičių. Kartais
                net iš pirmo žvilgsnio paprastas numeris gali turėti paslėptą
                reikšmę arba būti patrauklus kolekcininkams.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                Šis gidas padės suprasti, kodėl vieni numeriai sulaukia daugiau
                dėmesio, kokias reikšmes verta pastebėti ir kaip pasiruošti
                pardavimui. Tai nėra kainų skaičiuoklė: vertė priklauso nuo
                paklausos, pirkėjo ir konkrečios situacijos.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/numerio-analize"
                  className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Analizuoti numerį
                </Link>
                <Link
                  href="/parduoti"
                  className="app-button-secondary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Parduoti numerį
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] p-5">
              <PlatePreview
                plateText="VIP777"
                plateType="personalized"
                flagType="eu_symbol"
                size="lg"
                className="plate-preview--hero"
              />
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="value-factors-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Kas lemia kainą</p>
              <h2 id="value-factors-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Kas gali daryti numerį vertingesnį?
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                Numerio kaina retai atsiranda iš vieno požymio. Dažniausiai
                stiprus derinys turi kelias savybes: yra aiškus, lengvai
                įsimenamas, turi reikšmę ir pasiekia tinkamą pirkėją.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {valueFactors.map((factor) => (
                <article key={factor.title} className="app-card-soft p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-xs font-black text-[var(--primary-foreground)]">
                    {factor.icon}
                  </span>
                  <h3 className="mt-4 text-lg font-black text-[var(--foreground)]">{factor.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{factor.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="examples-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Pavyzdžiai</p>
              <h2 id="examples-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Kaip skaityti numerio reikšmę?
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                Tie patys simboliai skirtingiems žmonėms gali reikšti skirtingus
                dalykus. Todėl geras vertinimas turi paaiškinti ne vien tai, kad
                derinys įdomus, bet ir kam jis gali būti įdomus.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {examples.map((example) => (
                <Link
                  key={example.plate}
                  href={`/numerio-analize?plate=${encodeURIComponent(example.plate)}&auto=1`}
                  className="app-card flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                >
                  <div className="flex min-h-40 items-center justify-center bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] px-4 py-6">
                    <PlatePreview
                      plateText={example.plate}
                      plateType={example.type}
                      flagType={example.flag}
                      size="md"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-lg font-black text-[var(--foreground)]">{example.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-[var(--muted-foreground)]">
                      {example.text}
                    </p>
                    <span className="mt-4 text-sm font-black text-[var(--primary)]">
                      Analizuoti {example.plate}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="app-card p-5 sm:p-8" aria-labelledby="price-thinking-title">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Kainos logika</p>
            <h2 id="price-thinking-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
              Kaip praktiškai galvoti apie numerio kainą?
            </h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-[var(--muted-foreground)]">
              <p>
                Geriausias atspirties taškas yra ne klausimas „kiek norėčiau
                gauti?“, o klausimas „kam šis numeris galėtų būti svarbus?“.
                Jei derinys aiškiai primena vardą, automobilio modelį, verslo
                pavadinimą ar lengvai suprantamą simbolį, jo auditorija tampa
                konkretesnė. Kuo aiškiau galite paaiškinti, kodėl numeris
                įdomus, tuo lengviau pirkėjui suprasti jūsų prašomą kainą.
              </p>
              <p>
                Vertinant kainą verta atskirti emocinę vertę nuo rinkos vertės.
                Pardavėjui numeris gali turėti asmeninę istoriją, bet pirkėjas
                dažniausiai vertina, kaip numeris atrodys ant jo automobilio,
                ar jis dera su modeliu, ar lengvai įsimenamas ir ar panašių
                alternatyvų rinkoje yra daug. Todėl kartais stipri istorija
                padeda parduoti, o kartais svarbiau paprastas, švarus ir greitai
                perskaitomas derinys.
              </p>
              <p>
                Realistiškas skelbimas paprastai veikia geriau nei pernelyg
                drąsus pažadas. Aprašyme nurodykite ne tik kainą, bet ir tai,
                kokią reikšmę matote: paslėptą vardą, trigubus skaičius, markės
                asociaciją, retą simbolį ar kolekcinį raštą. Tada pirkėjas gali
                pats nuspręsti, ar ta reikšmė jam verta jūsų prašomos sumos.
              </p>
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="live-listings-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Prekyvietė</p>
                <h2 id="live-listings-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Aktyvūs numeriai pardavimui
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Tikra rinka padeda suprasti, kaip žmonės pateikia kainas ir
                  aprašo derinius. Lyginkite ne tik sumas, bet ir numerio
                  aiškumą, reikšmę, miestą, aprašymą bei paklausą.
                </p>
              </div>
              <Link href="/" className="app-button-secondary min-h-11 px-4 py-2 text-center text-sm">
                Visi skelbimai
              </Link>
            </div>

            {listings.length > 0 ? (
              <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} isSignedIn={isSignedIn} />
                ))}
              </div>
            ) : (
              <div className="app-card border-dashed p-6 text-center sm:p-10">
                <h3 className="text-xl font-black text-[var(--foreground)]">
                  Aktyvių skelbimų šiuo metu neradome
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Tai gera proga įkelti savo numerį. Aiškus aprašymas, paminėtos
                  reikšmės ir realistiška kaina padeda pirkėjams suprasti, kodėl
                  derinys gali būti vertas dėmesio.
                </p>
                <Link href="/parduoti" className="app-button-primary mt-5 px-5 py-3 text-sm">
                  Įkelti numerį
                </Link>
              </div>
            )}
          </section>

          <section className="app-card p-5 sm:p-8" aria-labelledby="myths-title">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Mitai</p>
            <h2 id="myths-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
              Dažni mitai apie numerio kainą
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {myths.map((myth) => (
                <article key={myth.title} className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4">
                  <h3 className="text-base font-black text-[var(--foreground)]">{myth.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{myth.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="how-unikodas-helps-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Unikodas</p>
              <h2 id="how-unikodas-helps-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Kaip Unikodas padeda suprasti numerio vertę?
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {helpItems.map((item, index) => (
                <article key={item.title} className="app-card-soft p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)]">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-black text-[var(--foreground)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="app-card p-5 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Bendruomenė</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Vis dar abejojate savo numerio verte?
                </h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted-foreground)]">
                  Automatinė analizė padeda pastebėti raštus ir asociacijas, bet
                  gyvi entuziastai gali pasakyti, kaip derinys atrodo iš rinkos
                  pusės. Bendruomenėje galite parodyti numerį, išgirsti nuomonių
                  ir suprasti, kokiai auditorijai jis gali būti patrauklus.
                </p>
              </div>
              <a
                href={TELEGRAM_URL}
                className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
              >
                Prisijungti prie Telegram
              </a>
            </div>
          </section>

          <section className="app-card p-5 text-center sm:p-8">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Pardavimas</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--foreground)]">
              Turite įdomų numerį?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              Įkelkite jį į Unikodas ir leiskite pirkėjams jus surasti.
              Skelbime paaiškinkite, kuo numeris išsiskiria: vardu, modelio
              asociacija, pasikartojimu, simboliu ar asmenine istorija.
            </p>
            <Link href="/parduoti" className="app-button-primary mt-6 min-h-[52px] px-6 py-3 text-sm">
              Paskelbti numerį
            </Link>
          </section>

          <section className="space-y-4" aria-labelledby="faq-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">DUK</p>
              <h2 id="faq-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Dažniausiai užduodami klausimai apie numerio vertę
              </h2>
            </div>
            <FaqAccordion items={faqs} />
          </section>

          <section className="app-card p-5 sm:p-6" aria-labelledby="internal-links-title">
            <h2 id="internal-links-title" className="text-2xl font-black text-[var(--foreground)]">
              Naudingos Unikodas nuorodos
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {internalLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4 transition hover:border-[var(--primary)]"
                >
                  <span className="block text-base font-black text-[var(--foreground)]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--muted-foreground)]">
                    {item.text}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
