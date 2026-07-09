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

      <ol className="list-decimal space-y-3 pl-6">
        <li>Platforma suteikia galimybę vartotojams skelbti ir ieškoti valstybinių numerių.</li>
        <li>Už skelbimų turinį, tikslumą ir teisingumą atsako pats vartotojas.</li>
        <li>unikodas.lt nėra sandorio šalis ir neprisiima atsakomybės už vartotojų tarpusavio susitarimus.</li>
        <li>Draudžiama skelbti neteisėtą, klaidinančią, apgaulingą ar įžeidžiančią informaciją.</li>
        <li>Administracija pasilieka teisę pašalinti skelbimus ar apriboti vartotojų prieigą be išankstinio įspėjimo.</li>
        <li>Vartotojų duomenys naudojami tik platformos veikimui, saugumui ir komunikacijai užtikrinti.</li>
      </ol>
      </main>
    </>
  );
}
