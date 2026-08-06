import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/auth/require-admin';
import { updateBuyerQualification } from './actions';

type Profile = { id: string; phone: string | null; email: string | null; email_verified_at: string | null; display_name: string | null };
type Participation = {
  id: string;
  user_id: string;
  status: string;
  paid_at: string | null;
  contact_consent_at: string | null;
  call_status: 'not_called' | 'qualified' | 'unreachable' | 'not_serious';
  called_at: string | null;
  call_note: string | null;
};

const callLabels: Record<Participation['call_status'], string> = {
  not_called: 'Patikros nereikia',
  qualified: 'Patikrintas telefonu',
  unreachable: 'Nepavyko susisiekti',
  not_serious: 'Įtartinas / nedalyvaus',
};

export default async function AdminAuctionContacts({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const [{ data: auction }, { data: bids }, { data: participations }] = await Promise.all([
    admin.from('auctions').select('id,seller_id,winner_id,plate_text,status,current_price_eur,bid_count,starts_at,ends_at').eq('id', id).single(),
    admin.from('auction_bids').select('bidder_id,max_amount_eur,created_at,updated_at').eq('auction_id', id).order('max_amount_eur', { ascending: false }),
    admin.from('auction_participations').select('id,user_id,status,paid_at,contact_consent_at,call_status,called_at,call_note').eq('auction_id', id).eq('status', 'paid').order('paid_at'),
  ]);
  if (!auction) notFound();

  const paid = (participations ?? []) as Participation[];
  const ids = Array.from(new Set([auction.seller_id, auction.winner_id, ...paid.map((entry) => entry.user_id)].filter(Boolean))) as string[];
  const { data: profiles } = ids.length
    ? await admin.from('profiles').select('id,phone,email,email_verified_at,display_name').in('id', ids)
    : { data: [] };
  const profileMap = new Map((profiles as Profile[] ?? []).map((profile) => [profile.id, profile]));
  const bidMap = new Map((bids ?? []).map((bid) => [bid.bidder_id, bid]));

  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-slate-900">
    <div className="flex justify-between gap-4">
      <div><p className="text-sm text-slate-500">Administracija · kontaktai nevieši</p><h1 className="font-mono text-3xl font-black">{auction.plate_text}</h1><p>{auction.status} · €{auction.current_price_eur} · {auction.bid_count} statymų</p></div>
      <Link href="/admin" className="underline">Atgal</Link>
    </div>

    <section className="rounded-2xl border bg-white p-5">
      <h2 className="mb-3 text-xl font-bold">Pardavėjas</h2>
      <Contact profile={profileMap.get(auction.seller_id)} />
      <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">Prieš patvirtindami aukcioną susisiekite ir paprašykite nuosavybės / teisės disponuoti numeriu įrodymo.</p>
    </section>

    <section className="rounded-2xl border bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Sumokėję dalyviai ({paid.length})</h2><span className="text-sm text-slate-500">Skambinkite tik kilus įtarimui</span></div>
      <div className="space-y-3">
        {paid.length === 0 && <p className="text-sm text-slate-500">Kol kas nėra sumokėjusių dalyvių.</p>}
        {paid.map((entry, index) => {
          const profile = profileMap.get(entry.user_id);
          const bid = bidMap.get(entry.user_id);
          return <article key={entry.id} className="rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex flex-wrap justify-between gap-2">
              <strong>{auction.winner_id === entry.user_id ? 'Pirmaujantis / laimėtojas' : `Dalyvis ${index + 1}`}</strong>
              <span className="font-bold">{bid ? `maks. €${bid.max_amount_eur}` : 'Dar nestatė'}</span>
            </div>
            <Contact profile={profile} />
            <p className="mt-2 text-xs text-slate-500">Kontaktui sutiko: {entry.contact_consent_at ? new Date(entry.contact_consent_at).toLocaleString('lt-LT') : 'nėra įrašo'}</p>
            <form action={updateBuyerQualification} className="mt-3 grid gap-2 sm:grid-cols-[13rem_1fr_auto]">
              <input type="hidden" name="participation_id" value={entry.id} />
              <input type="hidden" name="auction_id" value={auction.id} />
              <select name="call_status" defaultValue={entry.call_status} className="rounded-lg border bg-white px-3 py-2 text-sm">
                {Object.entries(callLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input name="call_note" defaultValue={entry.call_note ?? ''} maxLength={500} placeholder="Trumpa pokalbio pastaba" className="rounded-lg border bg-white px-3 py-2 text-sm" />
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">Išsaugoti</button>
            </form>
          </article>;
        })}
      </div>
    </section>
  </main>;
}

function Contact({ profile }: { profile: Profile | undefined }) {
  if (!profile) return <p className="text-red-600">Profilio duomenų rasti nepavyko.</p>;
  return <div className="grid gap-2 sm:grid-cols-2">
    <div><span className="block text-xs text-slate-500">Telefonas (SMS patvirtintas)</span><a href={profile.phone ? `tel:${profile.phone}` : undefined} className="font-bold text-blue-700">{profile.phone ?? 'Nėra'}</a></div>
    <div><span className="block text-xs text-slate-500">El. paštas</span><a href={profile.email ? `mailto:${profile.email}` : undefined} className="font-bold text-blue-700">{profile.email ?? 'Nėra'} {profile.email_verified_at ? '✓' : '⚠ nepatvirtintas'}</a></div>
  </div>;
}
