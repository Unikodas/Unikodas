import Link from 'next/link';
import type { Metadata } from 'next';
import { JsonLd } from '@/components/JsonLd';
import { ListingCard, type ListingCardData } from '@/components/ListingCard';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { FaqAccordion } from '@/components/FaqAccordion';
import { createPageMetadata } from '@/lib/seo';
import { breadcrumbJsonLd, collectionPageJsonLd, faqPageJsonLd, itemListJsonLd } from '@/lib/structured-data';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = createPageMetadata({
  title: 'Motociklų numeriai | Unikodas',
  description:
    'Peržiūrėkite motociklų numerius Lietuvoje. Raskite išskirtinius motociklo numerius, sužinokite kaip juos pirkti, parduoti ir perregistruoti saugiai.',
  path: '/motociklu-numeriai',
});

const LISTINGS_LIMIT = 6;

const steps = [
  'Peržiūrėkite motociklų numerių skelbimus',
  'Susisiekite su pardavėju',
  'Susitarkite dėl kainos',
  'Susitikite saugioje vietoje',
  'Sandorį užbaikite Regitroje',
  'Jei parduodate, įkelkite skelbimą į Unikodas',
];

const faqs = [
  {
    question: 'Ar motociklo numerį galima parduoti?',
    answer:
      'Motociklo numerio perleidimo galimybės priklauso nuo galiojančios tvarkos ir konkrečios situacijos. Jei numerį galima teisėtai perregistruoti ar perduoti, pardavėjas gali ieškoti pirkėjo, tačiau prieš sandorį verta pasitikrinti aktualią informaciją Regitroje.',
  },
  {
    question: 'Ar motociklų numeriai skiriasi nuo automobilių numerių?',
    answer:
      'Taip, motociklų numeriai paprastai yra kitokio formato ir dydžio nei automobilių numeriai. Jie pritaikyti motociklams, todėl numerio kombinacija ir vizualus pateikimas gali atrodyti kitaip nei standartinėje automobilio lentelėje.',
  },
  {
    question: 'Kiek kainuoja motociklo numeris?',
    answer:
      'Kaina priklauso nuo kombinacijos retumo, aiškumo, paklausos ir pardavėjo lūkesčių. Trumpi, švarūs ar lengvai įsimenami motociklo valstybiniai numeriai dažnai gali būti patrauklesni pirkėjams, bet galutinę kainą sutaria abi pusės.',
  },
  {
    question: 'Ar reikia vykti į Regitrą?',
    answer:
      'Dažniausiai saugiausia sandorį užbaigti ten, kur galima oficialiai sutvarkyti numerio perregistravimą. Tikslią eigą ir reikalingus dokumentus reikėtų pasitikrinti Regitroje prieš susitikimą.',
  },
  {
    question: 'Ar Unikodas garantuoja sandorį?',
    answer:
      'Ne. Unikodas yra skelbimų ir vidinių žinučių platforma, bet nėra sandorio šalis, netarpininkauja mokėjimuose ir nesuteikia teisinių garantijų. Pirkėjai ir pardavėjai patys atsakingai susitaria dėl sąlygų.',
  },
];

export default async function MotorcyclePlatesPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const isSignedIn = !!userData.user;

  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, plate_text, plate_type, flag_type, city, price_eur, description, is_verified_listing, created_at',
    )
    .eq('status', 'active')
    .eq('plate_type', 'motorcycle')
    .order('created_at', { ascending: false })
    .limit(LISTINGS_LIMIT);

  if (error) {
    console.error('[motociklu-numeriai] listings query failed:', error);
  }

  const listings = (data ?? []) as ListingCardData[];

  return (
    <>
      <JsonLd
        data={[
          collectionPageJsonLd({
            name: 'Motociklų numeriai',
            description:
              'Motociklų numerių kategorija Unikodas prekyvietėje su aktyviais skelbimais ir saugaus pirkimo gairėmis.',
            path: '/motociklu-numeriai',
          }),
          itemListJsonLd({
            name: 'Motociklų numeriai pardavimui',
            path: '/motociklu-numeriai',
            listings,
          }),
          faqPageJsonLd(faqs),
          breadcrumbJsonLd([
            { name: 'Numeriai', path: '/' },
            { name: 'Motociklų numeriai', path: '/motociklu-numeriai' },
          ]),
        ]}
      />

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
                Motociklų numerių skelbimai
              </p>
              <h1 className="mt-3 text-[clamp(2.1rem,9vw,3.7rem)] font-black leading-tight text-[var(--foreground)]">
                Motociklų numeriai
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
                Ši kategorija skirta motociklų numeriams Lietuvoje: čia galite
                rasti išskirtinius motociklo numerius, susisiekti su pardavėju
                per Unikodas žinutes arba įkelti savo motociklo numerio
                skelbimą pardavimui.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Peržiūrėti numerius
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
                plateText="123AB"
                plateType="motorcycle"
                flagType="lithuanian_flag"
                size="lg"
              />
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="motorcycle-listings-title">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Skelbimai</p>
                <h2
                  id="motorcycle-listings-title"
                  className="mt-1 text-2xl font-black text-[var(--foreground)]"
                >
                  Motociklų numeriai pardavimui
                </h2>
              </div>
              <Link
                href="/?type=motorcycle"
                className="inline-flex min-h-11 items-center text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Visi motociklų numeriai
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
                  Šiuo metu motociklų numerių skelbimų neradome
                </h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
                  Peržiūrėkite motociklų numerių kategoriją kataloge arba
                  įkelkite savo skelbimą, jei turite išskirtinį motociklo
                  numerį pardavimui.
                </p>
                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link href="/?type=motorcycle" className="app-button-primary px-5 py-3 text-sm">
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
              Kuo skiriasi motociklų numeriai?
            </h2>
            <div className="mt-4 space-y-4 text-base leading-8 text-[var(--muted-foreground)]">
              <p>
                Motociklų numeriai yra valstybiniai numeriai, pritaikyti
                motociklams ir kitoms atitinkamoms transporto priemonėms. Jie
                atlieka tą pačią pagrindinę funkciją kaip ir automobilių
                numeriai – identifikuoja transporto priemonę registre – tačiau
                skiriasi savo formatu, dydžiu ir tuo, kaip atrodo pritvirtinti
                prie motociklo. Dėl mažesnės lentelės erdvės motociklo numerio
                kombinacija dažnai atrodo kompaktiškesnė, todėl aiškumas ir
                įskaitomumas tampa ypač svarbūs.
              </p>
              <p>
                Pirkėjai motociklo numerius renkasi ne tik dėl praktinių
                priežasčių. Trumpa, tvarkinga ar lengvai įsimenama kombinacija
                gali tapti motociklo stiliaus dalimi, ypač jei ji dera prie
                modelio, klubo, vardo, inicialų ar kitos asmeninės reikšmės.
                Tokie motociklo valstybiniai numeriai gali būti patrauklūs
                entuziastams, kolekcionieriams ar žmonėms, kurie nori, kad jų
                transporto priemonė atrodytų išskirtiniau.
              </p>
              <p>
                Vertę dažniausiai didina trumpumas, retumas, švari simbolių
                tvarka ir lengvas įsiminimas. Vis dėlto reali kaina priklauso
                nuo paklausos, pardavėjo lūkesčių ir konkrečios kombinacijos
                reikšmės pirkėjui. Vienam žmogui svarbiausias gali būti skaičių
                derinys, kitam – inicialai ar su motociklu susijusi idėja.
              </p>
              <p>
                Unikodas padeda pirkėjams ir pardavėjams rasti vieniems kitus:
                galite peržiūrėti motociklų numerių skelbimus, pradėti pokalbį
                per vidines žinutes ir susitarti dėl tolimesnių veiksmų. Pats
                numerio perdavimas turėtų būti atliekamas saugiai, aiškiai ir
                oficialiai, dažniausiai tvarkant formalumus per Regitrą.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Procesas</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Kaip pirkti arba parduoti motociklo numerį?
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/" className="app-button-secondary px-4 py-3 text-sm">
                Naršyti numerius
              </Link>
              <Link href="/parduoti" className="app-button-secondary px-4 py-3 text-sm">
                Įkelti skelbimą
              </Link>
              <Link href="/vardiniai-numeriai" className="app-button-secondary px-4 py-3 text-sm">
                Vardiniai numeriai
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
