import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AuctionCountdown } from '@/components/AuctionCountdown';
import { AuctionJoinPanel } from '@/components/AuctionJoinPanel';
import { BidForm } from '@/components/BidForm';
import { LogoLink } from '@/components/LogoLink';
import { PlatePreview } from '@/components/PlatePreview';
import { finalizeExpiredAuctions } from '@/lib/auctions/finalize';
import { lt } from '@/lib/i18n/lt';
import { createClient } from '@/lib/supabase/server';
import { minimumBid } from '@/lib/validation/auction';
import type { FlagType, PlateType } from '@/lib/validation/listing';
import { placeBidAction } from './actions';

type Auction = {
  id: string;
  seller_id: string;
  plate_text: string;
  plate_type: string;
  flag_type: string;
  city: string;
  description: string | null;
  start_price_eur: number;
  current_price_eur: number;
  starts_at: string;
  ends_at: string;
  status: string;
  reserve_met: boolean;
  bid_count: number;
  participant_count: number;
};

async function getAuction(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('public_auctions').select('*').eq('id', id).single<Auction>();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const auction = await getAuction(id);
  return auction ? {
    title: `${auction.plate_text} aukcionas`,
    description: `Dalyvaukite numerio ${auction.plate_text} aukcione.`,
    alternates: { canonical: `/aukcionai/${id}` },
  } : {};
}

export default async function AuctionDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  await finalizeExpiredAuctions();
  const { id } = await params;
  const paymentState = (await searchParams).payment;
  const supabase = await createClient();
  const [{ data: auction }, { data: auth }] = await Promise.all([
    supabase.from('public_auctions').select('*').eq('id', id).single<Auction>(),
    supabase.auth.getUser(),
  ]);
  if (!auction) notFound();

  const [{ data: profile }, { data: participation }] = auth.user ? await Promise.all([
    supabase.from('profiles')
      .select('phone,email,email_verified_at,email_notifications_enabled')
      .eq('id', auth.user.id).maybeSingle(),
    supabase.from('auction_participations')
      .select('status').eq('auction_id', id).eq('user_id', auth.user.id).maybeSingle(),
  ]) : [{ data: null }, { data: null }];

  const now = Date.now();
  const live = ['scheduled', 'live'].includes(auction.status)
    && new Date(auction.starts_at).getTime() <= now
    && new Date(auction.ends_at).getTime() > now;
  const ended = auction.status === 'ended' || new Date(auction.ends_at).getTime() <= now;
  const openForEntry = ['scheduled', 'live'].includes(auction.status) && !ended;
  const paid = participation?.status === 'paid';
  const bidAction = placeBidAction.bind(null, auction.id);
  const startsLabel = new Intl.DateTimeFormat('lt-LT', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Europe/Vilnius',
  }).format(new Date(auction.starts_at));

  return <>
    <header className="app-header sticky top-0 z-40">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <LogoLink />
        <Link href="/aukcionai" className="text-sm font-bold text-[var(--muted-foreground)]">Visi aukcionai</Link>
      </nav>
    </header>
    <main className="app-shell mx-auto min-h-screen max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section className="space-y-5">
          <div className="app-card flex min-h-72 items-center justify-center p-5 sm:min-h-96">
            <PlatePreview plateText={auction.plate_text} plateType={auction.plate_type as PlateType} flagType={auction.flag_type as FlagType} size="lg" />
          </div>
          <div className="app-card p-5 sm:p-6">
            <h1 className="font-mono text-3xl font-black tracking-wider sm:text-4xl">{auction.plate_text}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[var(--muted-foreground)]">
              <span className="rounded-full bg-[var(--muted)] px-3 py-1.5">{auction.city}</span>
              <span className="rounded-full bg-[var(--muted)] px-3 py-1.5">{lt.listings.types[auction.plate_type as PlateType]}</span>
            </div>
            {auction.description && <p className="mt-5 whitespace-pre-wrap leading-7 text-[var(--muted-foreground)]">{auction.description}</p>}
          </div>
        </section>

        <aside className="app-card p-5 lg:sticky lg:top-24">
          <p className="text-xs font-black uppercase tracking-wide text-[var(--muted-foreground)]">{ended ? 'Galutinė kaina' : 'Dabartinė kaina'}</p>
          <p className="mt-1 text-4xl font-black">€{auction.current_price_eur.toLocaleString('lt-LT')}</p>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-[var(--muted-foreground)]">{auction.bid_count} statymų · {auction.participant_count ?? 0} dalyvių</span>
            <strong className={ended ? 'text-[var(--muted-foreground)]' : 'text-amber-400'}>
              {ended ? 'Baigėsi' : live ? <AuctionCountdown endsAt={auction.ends_at} /> : `Pradžia ${startsLabel}`}
            </strong>
          </div>
          <p className={`mt-3 rounded-xl p-3 text-sm font-bold ${auction.reserve_met ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {auction.reserve_met ? 'Rezervinė kaina pasiekta' : 'Rezervinė kaina dar nepasiekta'}
          </p>
          <div className="my-5 border-t border-[var(--border)]" />

          {paymentState === 'success' && <p role="status" className="mb-4 rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-400">Mokėjimas patvirtintas. Galite dalyvauti aukcione.</p>}
          {paymentState === 'cancelled' && <p role="status" className="mb-4 rounded-xl bg-amber-500/10 p-3 text-sm font-bold text-amber-300">Mokėjimas neatliktas. Dalyvavimas neaktyvuotas.</p>}

          {auth.user?.id === auction.seller_id ? (
            <p className="text-sm text-[var(--muted-foreground)]">Tai jūsų aukcionas. Savininkas jame statyti negali.</p>
          ) : paid ? (
            <div className="space-y-4">
              <p className="rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-400">Dalyvavimas patvirtintas · €2 sumokėta</p>
              {live ? <BidForm action={bidAction} minimum={minimumBid(auction.current_price_eur)} /> : <p className="text-sm text-[var(--muted-foreground)]">Kai aukcionas prasidės, statymo forma atsiras čia.</p>}
            </div>
          ) : openForEntry ? (
            <AuctionJoinPanel
              auctionId={auction.id}
              isSignedIn={Boolean(auth.user)}
              phoneVerified={Boolean(profile?.phone)}
              emailVerified={Boolean(profile?.email && profile?.email_verified_at)}
              notificationsEnabled={profile?.email_notifications_enabled === true}
            />
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">Šiame aukcione dalyvauti nebegalima.</p>
          )}

          <div className="mt-5 rounded-2xl bg-[var(--muted)] p-4 text-xs leading-5 text-[var(--muted-foreground)]">
            <strong className="block text-sm text-[var(--foreground)]">Apsauga nuo paskutinės sekundės</strong>
            Statymas per paskutines 2 minutes pratęsia aukcioną dar 2 minutėmis.
          </div>
        </aside>
      </div>
    </main>
  </>;
}
