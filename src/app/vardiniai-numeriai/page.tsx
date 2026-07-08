import Link from 'next/link';
import type { Metadata } from 'next';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { FaqAccordion } from '@/components/FaqAccordion';
import { createPageMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Vardiniai numeriai | Unikodas',
  description:
    'Peržiūrėkite vardinius ir išskirtinius automobilių numerius Lietuvoje. Sužinokite, kaip išsirinkti, pirkti arba parduoti vardinį numerį per Unikodas.',
  path: '/vardiniai-numeriai',
});

const LISTINGS_LIMIT = 6;

const steps = [
  'Peržiūrėkite skelbimus',
  'Susisiekite su pardavėju',
  'Susitarkite dėl kainos',
  'Sandorį užbaikite Regitroje',
  'Jei parduodate, įkelkite skelbimą į Unikodas',
];

const faqs = [
  {
    question: 'Ar vardiniai numeriai Lietuvoje legalūs?',
    answer:
      'Vardiniai ar personalizuoti numeriai Lietuvoje gali būti naudojami pagal galiojančią registravimo tvarką, tačiau konkretūs reikalavimai priklauso nuo numerio kombinacijos ir Regitros taisyklių. Prieš pirkdami ar parduodami pasitikrinkite aktualią informaciją oficialiuose šaltiniuose.',
  },
  {
    question: 'Kiek kainuoja vardinis numeris?',
    answer:
      'Kaina priklauso nuo kombinacijos retumo, žodžio ar inicialų reikšmės, numerio švarumo ir paklausos. Trumpi, aiškūs, lengvai įsimenami numeriai dažnai vertinami brangiau, bet galutinę kainą visada sutaria pirkėjas ir pardavėjas.',
  },
  {
    question: 'Ar galima parduoti vardinį numerį?',
    answer:
      'Jei numerį galima teisėtai perleisti ar perregistruoti pagal galiojančią tvarką, pardavėjas gali ieškoti pirkėjo. Unikodas padeda paskelbti numerį ir susisiekti, bet pats sandoris turi būti sutvarkytas atsakingai.',
  },
  {
    question: 'Kaip vyksta numerio perregistravimas?',
    answer:
      'Tiksli eiga priklauso nuo situacijos, todėl prieš sandorį verta pasitikrinti Regitros informaciją. Saugiausia pirkėjui ir pardavėjui susitarti dėl sąlygų iš anksto ir formalumus užbaigti oficialiai.',
  },
  {
    question: 'Ar Unikodas dalyvauja sandoryje?',
    answer:
      'Ne. Unikodas nėra sandorio šalis, netarpininkauja mokėjimuose ir nesuteikia teisinių garantijų. Platforma skirta skelbimams, paieškai ir saugesniam pradiniam bendravimui per vidines žinutes.',
  },
];

export default async function PersonalizedPlatesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = !!userData.user;

  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at',
    )
    .eq('status', 'active')
    .eq('plate_type', 'personalized')
    .order('created_at', { ascending: false })
    .limit(LISTINGS_LIMIT);

  if (error) {
    console.error('[vardiniai-numeriai] listings query failed:', error);
  }

  const listings = (data ?? []) as ListingCardData[];

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <LogoLink />
          <Link
            href="/parduoti"
            className="hidden rounded-xl bg-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] sm:inline-flex"
          >
            Parduoti numerį
          </Link>
        </nav>
      </header>

      <main className="app-shell">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <section className="app-card grid max-w-full gap-6 overflow-hidden p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase text-[var(--primary)]">
                Personalizuoti numeriai
              </p>
              <h1 className="mt-3 text-[clamp(2.1rem,9vw,3.7rem)] font-black leading-tight text-[var(--foreground)]">
                Vardiniai numeriai
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
                Vardiniai numeriai yra personalizuotos, lengvai įsimenamos ar
                išskirtinės Lietuvos transporto priemonių numerių kombinacijos.
                Tai gali būti vardai, inicialai, verslo pavadinimai ar trumpi
                simbolių deriniai, kurie automobiliui suteikia daugiau
                individualumo.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Peržiūrėti numerius
                </Link>
                <Link
                  href="/kaip-parduoti-numeri"
                  className="app-button-secondary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Parduoti numerį
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] p-5">
              <PlatePreview
                plateText="MANO1"
                plateType="personalized"
                flagType="eu_symbol"
                size="lg"
                className="plate-preview--hero"
              />
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="personalized-listings-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Skelbimai</p>
                <h2
                  id="personalized-listings-title"
                  className="mt-1 text-2xl font-black text-[var(--foreground)]"
                >
                  Vardiniai numeriai pardavimui
                </h2>
              </div>
              <Link
                href="/?type=personalized"
                className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Visi vardiniai
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
                  Šiuo metu vardinių numerių skelbimų neradome
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Peržiūrėkite visus personalizuotus numerius kataloge arba
                  įkelkite savo skelbimą, jei turite gražų numerį pardavimui.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/?type=personalized"
                    className="app-button-primary px-5 py-3 text-sm"
                  >
                    Peržiūrėti kategoriją
                  </Link>
                  <Link href="/parduoti" className="app-button-secondary px-5 py-3 text-sm">
                    Įkelti skelbimą
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="app-card p-5 sm:p-8">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Apie kategoriją</p>
            <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
              Kas yra vardinis numeris?
            </h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-[var(--muted-foreground)]">
              <p>
                Vardiniai numeriai – tai personalizuotos arba ypač lengvai
                įsimenamos transporto priemonių numerių kombinacijos. Lietuvoje
                žmonės dažnai ieško numerių, kurie primena vardą, pavardės
                inicialus, įmonės pavadinimą, automobilio modelį, hobį ar kitą
                asmeninę reikšmę turintį žodį. Tokios kombinacijos išsiskiria
                iš įprastų numerių, todėl automobilis atrodo individualesnis, o
                pats numeris tampa savotiška identiteto dalimi.
              </p>
              <p>
                Vardinį numerį gali sudaryti vardas, pavyzdžiui, trumpa vardo
                forma, inicialai, verslo ženklas ar trumpa įsimenama raidžių ir
                skaičių kombinacija. Pirkėjai tokius numerius renkasi dėl
                estetikos, reprezentacijos, reklaminės vertės arba paprasčiausiai
                dėl to, kad numerį lengva prisiminti. Įmonėms aktualūs numeriai,
                kurie dera su prekės ženklu, o privatiems pirkėjams dažnai
                svarbios datos, vardai ar simboliai, turintys asmeninę istoriją.
              </p>
              <p>
                Vertę paprastai didina trumpumas, aiškumas, retumas ir švari
                kombinacija be nereikalingų simbolių. Kuo numeris lengviau
                perskaitomas ir kuo labiau primena konkretų vardą ar žodį, tuo
                didesnė tikimybė, kad jis bus patrauklus pirkėjams. Vis dėlto
                reali kaina priklauso nuo paklausos ir susitarimo tarp pirkėjo
                ir pardavėjo.
              </p>
              <p>
                Unikodas padeda pirkėjams ir pardavėjams rasti vieniems kitus:
                čia galima naršyti vardinių numerių skelbimus, filtruoti
                kombinacijas ir pradėti pokalbį per vidines žinutes. Platforma
                nėra sandorio šalis, todėl svarbu sąlygas aptarti atsakingai, o
                formalumus užbaigti oficialiai.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Procesas</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Kaip įsigyti arba parduoti vardinį numerį?
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, index) => (
                <article key={step} className="app-card-soft p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)]">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-black leading-6 text-[var(--foreground)]">
                    {step}
                  </h3>
                </article>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">DUK</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Dažniausiai užduodami klausimai
              </h2>
            </div>
            <FaqAccordion items={faqs} />
          </section>

          <section className="app-card p-5 sm:p-6">
            <h2 className="text-2xl font-black text-[var(--foreground)]">Naudingos nuorodos</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link href="/" className="app-button-secondary px-4 py-3 text-sm">
                Naršyti numerius
              </Link>
              <Link href="/parduoti" className="app-button-secondary px-4 py-3 text-sm">
                Įkelti skelbimą
              </Link>
              <Link href="/kaip-parduoti-numeri" className="app-button-secondary px-4 py-3 text-sm">
                Kaip parduoti numerį?
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
