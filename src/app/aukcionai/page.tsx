import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoLink } from '@/components/LogoLink';
import { MarketplaceTabs } from '@/components/MarketplaceTabs';
import { AuctionCard, type AuctionSummary } from '@/components/AuctionCard';

export const metadata: Metadata = {
  title: 'Numerių aukcionai',
  description: 'Dalyvaukite patikrintų lietuviškų valstybinių numerių aukcionuose.',
  alternates: { canonical: '/aukcionai' },
};

export const revalidate = 30;

export default async function AuctionsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('public_auctions')
    .select('id, plate_text, plate_type, flag_type, city, current_price_eur, reserve_met, bid_count, starts_at, ends_at, status')
    .in('status', ['scheduled', 'live', 'ended'])
    .order('ends_at', { ascending: true })
    .limit(120)
    .returns<AuctionSummary[]>();

  // A fresh local checkout may render before migration 0013 is applied.
  // PostgREST reports a missing table/view as PGRST205; treat that as an
  // empty auction catalogue so the launch page remains usable.
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('[aukcionai] query failed:', error);
  }
  const auctions = data ?? [];
  const now = Date.now();
  const live = auctions.filter((auction) => new Date(auction.starts_at).getTime() <= now && new Date(auction.ends_at).getTime() > now && auction.status !== 'ended');
  const upcoming = auctions.filter((auction) => new Date(auction.starts_at).getTime() > now);

  return (
    <>
      <header className="app-header sticky top-0 z-40">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <LogoLink />
          <Link href="/aukcionai/naujas" className="app-button-primary min-h-11 px-4 py-2 text-sm">Pateikti aukcionui</Link>
        </nav>
      </header>
      <main className="app-shell mx-auto min-h-screen max-w-6xl space-y-7 px-4 py-6 sm:px-6 sm:py-9">
        <MarketplaceTabs active="auctions" />
        <section className="app-card overflow-hidden p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">BETA</span>
            <p className="text-sm font-black uppercase text-[var(--primary)]">Patikrinti numeriai · automatinis statymas</p>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-5xl">Numerių aukcionai</h1>
          <p className="mt-3 max-w-2xl leading-7 text-[var(--muted-foreground)]">Įrašykite didžiausią sumą, kurią sutinkate mokėti. Sistema statys už jus tik tiek, kiek reikia pirmavimui. Jūsų maksimali suma lieka slapta.</p>
          <p className="mt-3 max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">BETA testavimo metu aukciono pateikimas ir dalyvavimas nemokami. Reikalingas patvirtintas telefono numeris, patvirtintas el. paštas ir įjungti aukcionų pranešimai.</p>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
            <div className="app-card-soft p-4"><strong className="block text-[var(--foreground)]">1. Pasirinkite maksimumą</strong><span className="text-[var(--muted-foreground)]">Kiti dalyviai jo nematys.</span></div>
            <div className="app-card-soft p-4"><strong className="block text-[var(--foreground)]">2. Sistema varžosi už jus</strong><span className="text-[var(--muted-foreground)]">Kaina kyla nustatytais žingsniais.</span></div>
            <div className="app-card-soft p-4"><strong className="block text-[var(--foreground)]">3. Laimėtojas susisiekia</strong><span className="text-[var(--muted-foreground)]">Sandoris užbaigiamas po aukciono.</span></div>
          </div>
        </section>

        {live.length > 0 ? (
          <section className="space-y-4">
            <div><h2 className="text-2xl font-black text-[var(--foreground)]">Vyksta dabar</h2><p className="text-sm text-[var(--muted-foreground)]">Paskutinės 2 minutės statymas pratęsia aukcioną 2 minutėmis.</p></div>
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">{live.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}</div>
          </section>
        ) : (
          <section className="app-card border-dashed p-8 text-center">
            <h2 className="text-xl font-black text-[var(--foreground)]">Ruošiame pirmuosius aukcionus</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">Kiekvieną numerį patikrinsime prieš paskelbdami. Turite išskirtinį numerį? Pateikite jį peržiūrai ir padėkite pradėti pirmąją aukcionų savaitę.</p>
            <Link href="/aukcionai/naujas" className="app-button-primary mt-5 inline-flex min-h-11 items-center px-5">Pateikti numerį</Link>
          </section>
        )}
        {upcoming.length > 0 && <section className="space-y-4"><h2 className="text-2xl font-black text-[var(--foreground)]">Netrukus prasidės</h2><div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">{upcoming.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}</div></section>}
      </main>
    </>
  );
}
