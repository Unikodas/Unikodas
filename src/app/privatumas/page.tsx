import type { Metadata } from 'next';

import { JsonLd } from '@/components/JsonLd';
import { createPageMetadata } from '@/lib/seo';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/structured-data';

export const metadata: Metadata = createPageMetadata({
  title: 'Privatumo politika | Unikodas',
  description:
    'Sužinokite, kokius duomenis Unikodas tvarko paskyroms, skelbimams, žinutėms, saugumui ir platformos veikimui užtikrinti.',
  path: '/privatumas',
});

export default function PrivacyPage() {
  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: 'Privatumo politika',
            description: 'Unikodas privatumo politikos informacija apie naudotojų duomenų tvarkymą.',
            path: '/privatumas',
          }),
          breadcrumbJsonLd([
            { name: 'Numeriai', path: '/' },
            { name: 'Privatumo politika', path: '/privatumas' },
          ]),
        ]}
      />

      <main className="mx-auto max-w-3xl px-4 py-10 text-slate-900">
        <h1 className="mb-6 text-3xl font-bold">Privatumo politika</h1>

      <p className="mb-4">
        unikodas.lt gerbia jūsų privatumą ir tvarko duomenis tik platformos veikimui užtikrinti.
      </p>

      <h2 className="mt-6 mb-2 text-xl font-semibold">Kokius duomenis renkame?</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Telefono numerį</li>
        <li>Paskyros informaciją</li>
        <li>Skelbimų informaciją</li>
        <li>Žinutes tarp vartotojų</li>
        <li>Pagrindinius techninius duomenis saugumui ir veikimui užtikrinti</li>
      </ul>

      <h2 className="mt-6 mb-2 text-xl font-semibold">Kam naudojame duomenis?</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Prisijungimui ir SMS patvirtinimui</li>
        <li>Skelbimų publikavimui</li>
        <li>Žinučių sistemai</li>
        <li>Saugumui ir piktnaudžiavimo prevencijai</li>
      </ul>

      <h2 className="mt-6 mb-2 text-xl font-semibold">Trečiųjų šalių paslaugos</h2>
      <p className="mb-4">
        SMS patvirtinimui naudojama Twilio paslauga. Apsaugai nuo automatinių veiksmų naudojama
        Cloudflare Turnstile. Svetainė taip pat naudoja prieglobos ir duomenų bazės paslaugas.
      </p>

      <h2 className="mt-6 mb-2 text-xl font-semibold">Jūsų teisės</h2>
      <p className="mb-4">
        Galite prašyti ištrinti arba pataisyti savo duomenis. Dėl klausimų susisiekite:
        info@unikodas.lt
      </p>
      </main>
    </>
  );
}
