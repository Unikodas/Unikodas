import Link from 'next/link';
import type { Metadata } from 'next';

import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { createPageMetadata } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { PlateAnalysisTool } from './PlateAnalysisTool';

export const metadata: Metadata = createPageMetadata({
  title: 'Unikodas įžvalgos | Unikodas',
  description:
    'Įveskite automobilio numerį ir gaukite Unikodas įžvalgas: paslėptos reikšmės, vardai, automobilių modeliai, raštai ir bendras derinio patrauklumas.',
  path: '/numerio-analize',
});

export default async function PlateAnalysisPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/" className="inline-flex min-h-11 min-w-12 items-center justify-center text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            Atgal
          </Link>
        </nav>
      </header>

      <main className="app-shell mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-9">
        <section className="app-card grid gap-6 overflow-hidden p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase text-[var(--primary)]">Unikodas įrankis</p>
            <h1 className="mt-3 text-[clamp(2.2rem,9vw,4rem)] font-black leading-tight tracking-tight text-[var(--foreground)]">
              Unikodas įžvalgos
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
              Įveskite numerio derinį ir sužinokite, kokias reikšmes, raštus ar automobilių
              asociacijas jis gali turėti, kam jis gali būti patrauklus ir kokios panašios idėjos
              galėtų įkvėpti.
            </p>
          </div>

          <div className="flex min-w-0 justify-center overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--primary)_18%,var(--muted)),var(--background))] p-4 sm:p-5">
            <PlatePreview
              plateText="M4T45"
              plateType="personalized"
              flagType="eu_symbol"
              size="lg"
              className="plate-preview--hero"
            />
          </div>
        </section>

        <PlateAnalysisTool isAuthenticated={Boolean(userData.user)} />
      </main>
    </>
  );
}
