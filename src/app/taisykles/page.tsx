import type { Metadata } from 'next';

import { JsonLd } from '@/components/JsonLd';
import { createPageMetadata } from '@/lib/seo';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = createPageMetadata({
  title: 'Naudojimosi taisyklės | Unikodas',
  description:
    'Perskaitykite Unikodas naudojimosi taisykles: skelbimų atsakomybė, naudotojų susitarimai, saugumas ir platformos naudojimo sąlygos.',
  path: '/taisykles',
});

export default function TermsPage() {
  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: 'Naudojimosi taisyklės',
            description: 'Unikodas naudojimosi taisyklių informacija platformos naudotojams.',
            path: '/taisykles',
          }),
          breadcrumbJsonLd([
            { name: 'Numeriai', path: '/' },
            { name: 'Naudojimosi taisyklės', path: '/taisykles' },
          ]),
        ]}
      />

      <main className="mx-auto max-w-3xl px-4 py-10 text-slate-900">
      <h1 className="mb-6 text-3xl font-bold">Naudojimosi taisyklės</h1>

      <p className="mb-4">
        Naudodamiesi unikodas.lt, jūs sutinkate su šiomis taisyklėmis.
      </p>

      <p className="mb-4">
        Unikodas nėra AB „Regitra“, nėra valstybinė institucija ir nepakeičia
        oficialių transporto priemonių registravimo procedūrų. Platforma
        negamina, neišduoda ir neparduoda fizinių valstybinių numerių lentelių.
      </p>

      <ol className="list-decimal space-y-3 pl-6">
        <li>Platforma suteikia galimybę vartotojams skelbti ir ieškoti valstybinių numerių.</li>
        <li>Už skelbimų turinį, tikslumą ir teisingumą atsako pats vartotojas.</li>
        <li>unikodas.lt nėra sandorio šalis ir neprisiima atsakomybės už vartotojų tarpusavio susitarimus.</li>
        <li>Draudžiama skelbti neteisėtą, klaidinančią, apgaulingą ar įžeidžiančią informaciją.</li>
        <li>Draudžiama siūlyti netikras numerių lenteles, dokumentų klastojimą, registravimo tvarkos apėjimą ar kitus neteisėtus veiksmus.</li>
        <li>Visi numerio rezervavimo, registravimo, perleidimo ar perregistravimo formalumai turi būti atliekami oficialia teisės aktų nustatyta tvarka.</li>
        <li>Administracija pasilieka teisę pašalinti skelbimus ar apriboti vartotojų prieigą be išankstinio įspėjimo.</li>
        <li>Vartotojų duomenys naudojami tik platformos veikimui, saugumui ir komunikacijai užtikrinti.</li>
        <li>Aukcionuose gali dalyvauti tik SMS patvirtinę, el. paštą patvirtinę ir pranešimus įjungę vartotojai. Pateikdamas numerį ar statymą vartotojas sutinka, kad administracija matytų jo kontaktus, patikrintų tapatybę ir koordinuotų sandorį.</li>
      </ol>
      </main>
    </>
  );
}
