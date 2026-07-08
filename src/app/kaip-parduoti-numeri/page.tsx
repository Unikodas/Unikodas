import Link from 'next/link';
import type { Metadata } from 'next';
import { LogoLink } from '@/components/LogoLink';
import { FaqAccordion } from '@/components/FaqAccordion';
import { createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Kaip parduoti automobilio numerį? | Unikodas',
  description:
    'Sužinokite, kaip saugiai parduoti automobilio numerį Lietuvoje: kaip susitarti su pirkėju, perregistruoti numerį Regitroje ir įkelti skelbimą į Unikodas.',
  path: '/kaip-parduoti-numeri',
});

const steps = [
  'Įkelkite numerio skelbimą',
  'Susisiekite su pirkėju',
  'Susitarkite dėl kainos',
  'Susitikite saugioje vietoje',
  'Kartu vykite į Regitrą',
  'Perregistruokite numerį',
];

const safetyTips = [
  'Neprašykite ir nemokėkite didelių avansų',
  'Susitikite viešoje vietoje',
  'Sandorį užbaikite Regitroje',
  'Patikrinkite dokumentus',
  'Neskubėkite, jei pirkėjas spaudžia greitai pervesti pinigus',
];

const faqs = [
  {
    question: 'Ar galima parduoti valstybinį numerį?',
    answer:
      'Numerio perdavimo galimybės ir sąlygos priklauso nuo galiojančios tvarkos bei konkrečios situacijos. Prieš sandorį pasitikrinkite aktualią informaciją Regitroje ir pasiruoškite reikiamus dokumentus.',
  },
  {
    question: 'Ar Unikodas dalyvauja sandoryje?',
    answer:
      'Ne. Unikodas yra skelbimų ir vidinių žinučių platforma. Pirkėjas ir pardavėjas patys susitaria dėl kainos, susitikimo ir numerio perregistravimo.',
  },
  {
    question: 'Kiek kainuoja gražus numeris?',
    answer:
      'Kaina priklauso nuo kombinacijos retumo, paklausos, simbolių reikšmės ir pardavėjo lūkesčių. Palyginkite panašius skelbimus ir palikite vietos deryboms.',
  },
  {
    question: 'Ar reikia vykti į Regitrą?',
    answer:
      'Dažniausiai saugiausia sandorį užbaigti kartu ten, kur galima oficialiai sutvarkyti numerio perleidimą ar perregistravimą. Tikslią eigą verta pasitikrinti Regitroje prieš susitikimą.',
  },
  {
    question: 'Ar skelbimo įkėlimas mokamas?',
    answer:
      'Šiuo metu skelbimą galite įkelti nemokamai. Jei sąlygos ateityje keistųsi, jos būtų aiškiai nurodytos prieš skelbimo publikavimą.',
  },
];

export default function SellPlateGuidePage() {
  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Peržiūrėti numerius
          </Link>
        </nav>
      </header>

      <main className="app-shell">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <section className="app-card overflow-hidden p-5 sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-center lg:gap-8">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase text-[var(--primary)]">
                Saugus numerio pardavimas
              </p>
              <h1 className="mt-3 max-w-3xl text-[clamp(2rem,9vw,3.5rem)] font-black leading-tight text-[var(--foreground)]">
                Kaip parduoti automobilio numerį?
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
                Unikodas padeda žmonėms įkelti skelbimus ir rasti išskirtinius
                lietuviškus automobilių numerius vienoje vietoje. Pardavėjai ir
                pirkėjai bendrauja per vidines žinutes, o sandorio formalumus
                užbaigia saugiai ir aiškiai.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/parduoti"
                  className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Įkelti skelbimą
                </Link>
                <Link
                  href="/"
                  className="app-button-secondary min-h-[52px] px-5 py-3 text-center text-sm"
                >
                  Peržiūrėti numerius
                </Link>
              </div>
            </div>

            <div className="mt-7 rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] p-5 lg:mt-0">
              <div className="rounded-3xl bg-[var(--card)] p-4 shadow-[var(--app-shadow)]">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)] text-xs font-black text-[var(--primary-foreground)]">
                    LT
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase text-[var(--muted-soft)]">
                      Unikodas gidas
                    </p>
                    <p className="text-lg font-black text-[var(--foreground)]">
                      Skelbimas → žinutės → Regitra
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--muted-foreground)]">
                  Aiškus skelbimas, saugus susitikimas ir oficialus numerio
                  perregistravimas padeda išvengti painiavos.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Žingsniai</p>
              <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Pardavimo eiga
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step} className="app-card-soft p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)]">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-black text-[var(--foreground)]">{step}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                    {getStepDescription(index)}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="app-card p-5 sm:p-6">
            <div className="grid gap-5 lg:grid-cols-[18rem_minmax(0,1fr)]">
              <div>
                <p className="text-sm font-black uppercase text-[var(--primary)]">Saugumas</p>
                <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
                  Kaip parduoti saugiai?
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                  Gražus numeris gali būti vertingas, todėl verta neskubėti ir
                  sandorį užbaigti tik tada, kai viskas aišku abiem pusėms.
                </p>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {safetyTips.map((tip) => (
                  <li
                    key={tip}
                    className="flex gap-3 rounded-3xl border border-[var(--border)] bg-[var(--muted)] p-4 text-sm font-bold leading-6 text-[var(--foreground)]"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      ✓
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
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

          <section className="app-card p-5 text-center sm:p-8">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Pradėkite</p>
            <h2 className="mt-2 text-3xl font-black text-[var(--foreground)]">
              Turite gražų numerį?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              Sukurkite nemokamą skelbimą, parodykite numerį pirkėjams ir
              susisiekite per Unikodas žinutes.
            </p>
            <Link
              href="/parduoti"
              className="app-button-primary mt-6 min-h-[52px] px-6 py-3 text-center text-sm"
            >
              Parduoti numerį
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}

function getStepDescription(index: number): string {
  switch (index) {
    case 0:
      return 'Įrašykite numerio kombinaciją, miestą, kainą ir trumpą aprašymą.';
    case 1:
      return 'Atsakykite į pirkėjo klausimus per Unikodas vidines žinutes.';
    case 2:
      return 'Aiškiai aptarkite galutinę kainą, mokėjimo būdą ir susitikimo laiką.';
    case 3:
      return 'Rinkitės viešą vietą ir venkite spaudimo spręsti per greitai.';
    case 4:
      return 'Prieš vykdami pasitikrinkite, kokių dokumentų reikės jūsų situacijai.';
    default:
      return 'Sandorį užbaikite tik tada, kai numerio perdavimas sutvarkytas oficialiai.';
  }
}
