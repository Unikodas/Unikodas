import Link from 'next/link';
import type { Metadata } from 'next';

import { JsonLd } from '@/components/JsonLd';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { createPageMetadata } from '@/lib/seo';
import { articleJsonLd, breadcrumbJsonLd, organizationJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = createPageMetadata({
  title: 'Apie Unikodas | Automobilių numerių skelbimų platforma',
  description:
    'Unikodas yra Lietuvos automobilių numerių kombinacijų skelbimų ir paieškos platforma. Platforma nėra AB „Regitra“ ir visi formalumai tvarkomi oficialia tvarka.',
  path: '/apie',
});

const safetyPoints = [
  'Unikodas nėra AB „Regitra“ ir nėra valstybinė institucija.',
  'Platforma negamina, neišduoda ir neparduoda fizinių valstybinių numerių lentelių.',
  'Skelbimai skirti numerių kombinacijoms ir naudotojų susisiekimui.',
  'Registravimo, rezervavimo ar perleidimo veiksmai atliekami tik oficialia teisės aktų nustatyta tvarka.',
];

const processSteps = [
  'Naršote aktyvius skelbimus arba įkeliate savo numerio kombinaciją.',
  'Susisiekiate per Unikodas vidines žinutes ir aptariate sąlygas.',
  'Prieš sandorį pasitikrinate aktualią informaciją oficialiuose šaltiniuose.',
  'Formalumus užbaigiate atsakingai ir teisėtai pagal galiojančią tvarką.',
];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          organizationJsonLd(),
          articleJsonLd({
            headline: 'Apie Unikodas',
            description:
              'Informacija apie Unikodas automobilių numerių kombinacijų skelbimų platformą ir teisėto naudojimo principus.',
            path: '/apie',
          }),
          breadcrumbJsonLd([
            { name: 'Numeriai', path: '/' },
            { name: 'Apie Unikodas', path: '/apie' },
          ]),
        ]}
      />

      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <LogoLink />
          <Link
            href="/"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            Peržiūrėti skelbimus
          </Link>
        </nav>
      </header>

      <main className="app-shell">
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-10">
          <section className="app-card grid max-w-full gap-6 overflow-hidden p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-black uppercase text-[var(--primary)]">
                Skelbimų ir paieškos platforma
              </p>
              <h1 className="mt-3 text-[clamp(2.1rem,9vw,3.7rem)] font-black leading-tight text-[var(--foreground)]">
                Apie Unikodas
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
                Unikodas padeda žmonėms rasti, palyginti ir aptarti išskirtines
                Lietuvos transporto priemonių numerių kombinacijas. Tai
                skelbimų platforma, kurioje naudotojai gali pradėti pokalbį,
                bet oficialūs registravimo ar perleidimo veiksmai atliekami tik
                nustatyta tvarka.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/" className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm">
                  Peržiūrėti skelbimus
                </Link>
                <Link href="/taisykles" className="app-button-secondary min-h-[52px] px-5 py-3 text-center text-sm">
                  Naudojimosi taisyklės
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] p-5">
              <PlatePreview
                plateText="UN1K0D"
                plateType="personalized"
                flagType="eu_symbol"
                size="lg"
                className="plate-preview--hero"
              />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="compliance-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Atitiktis</p>
              <h2 id="compliance-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Aiškiai apie paskirtį
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
                Unikodas veikia kaip skelbimų, paieškos ir komunikacijos
                įrankis. Platforma nesuteikia teisinių garantijų, netarpininkauja
                mokėjimuose ir nepakeičia oficialių institucijų procedūrų.
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {safetyPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-semibold leading-6 text-[var(--text)]"
                >
                  {point}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4" aria-labelledby="process-title">
            <div>
              <p className="text-sm font-black uppercase text-[var(--primary)]">Procesas</p>
              <h2 id="process-title" className="mt-1 text-2xl font-black text-[var(--foreground)]">
                Kaip naudotis atsakingai?
              </h2>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {processSteps.map((step, index) => (
                <li key={step} className="app-card-soft p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)]">
                    {index + 1}
                  </span>
                  <p className="mt-4 text-sm font-semibold leading-6 text-[var(--foreground)]">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </section>

          <section className="app-card p-5 sm:p-6">
            <h2 className="text-2xl font-black text-[var(--foreground)]">Kontaktai</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
              Dėl platformos klausimų, skelbimų ar saugumo galite susisiekti el. paštu{' '}
              <a className="font-bold text-[var(--primary)]" href="mailto:info@unikodas.lt">
                info@unikodas.lt
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
