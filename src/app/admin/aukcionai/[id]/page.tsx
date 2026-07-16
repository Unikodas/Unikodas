import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/require-admin';

type Profile = { id:string; phone:string|null; email:string|null; email_verified_at:string|null; display_name:string|null };

export default async function AdminAuctionContacts({ params }: { params: Promise<{id:string}> }) {
  const { id } = await params;
  const { admin } = await requireAdmin();
  const { data: auction } = await admin.from('auctions').select('id,seller_id,winner_id,plate_text,status,current_price_eur,bid_count,starts_at,ends_at').eq('id',id).single();
  if (!auction) notFound();
  const { data: bids } = await admin.from('auction_bids').select('bidder_id,max_amount_eur,created_at,updated_at').eq('auction_id',id).order('max_amount_eur',{ascending:false});
  const ids = Array.from(new Set([auction.seller_id, auction.winner_id, ...(bids ?? []).map(b=>b.bidder_id)].filter(Boolean))) as string[];
  const { data: profiles } = ids.length ? await admin.from('profiles').select('id,phone,email,email_verified_at,display_name').in('id',ids) : {data:[]};
  const map = new Map((profiles as Profile[] ?? []).map(p=>[p.id,p]));
  const seller = map.get(auction.seller_id);
  return <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 text-slate-900">
    <div className="flex justify-between gap-4"><div><p className="text-sm text-slate-500">Administracija · kontaktai nevieši</p><h1 className="font-mono text-3xl font-black">{auction.plate_text}</h1><p>{auction.status} · €{auction.current_price_eur} · {auction.bid_count} statymų</p></div><Link href="/admin" className="underline">Atgal</Link></div>
    <section className="rounded-2xl border bg-white p-5"><h2 className="mb-3 text-xl font-bold">Pardavėjas</h2><Contact profile={seller} /><p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">Prieš patvirtindami aukcioną susisiekite ir paprašykite nuosavybės / teisės disponuoti numeriu įrodymo.</p></section>
    <section className="rounded-2xl border bg-white p-5"><h2 className="mb-3 text-xl font-bold">Statytojai ({bids?.length ?? 0})</h2><div className="space-y-3">{(bids ?? []).map((bid,index)=>{const profile=map.get(bid.bidder_id); return <article key={bid.bidder_id} className="rounded-xl bg-slate-50 p-4"><div className="mb-2 flex justify-between"><strong>{auction.winner_id===bid.bidder_id ? 'Pirmaujantis / laimėtojas' : `Dalyvis ${index+1}`}</strong><span className="font-bold">maks. €{bid.max_amount_eur}</span></div><Contact profile={profile} /></article>})}</div></section>
  </main>;
}

function Contact({profile}:{profile:Profile|undefined}) {
  if (!profile) return <p className="text-red-600">Profilio duomenų rasti nepavyko.</p>;
  return <div className="grid gap-2 sm:grid-cols-2"><div><span className="block text-xs text-slate-500">Telefonas (SMS patvirtintas)</span><a href={profile.phone ? `tel:${profile.phone}` : undefined} className="font-bold text-blue-700">{profile.phone ?? 'Nėra'}</a></div><div><span className="block text-xs text-slate-500">El. paštas</span><a href={profile.email ? `mailto:${profile.email}` : undefined} className="font-bold text-blue-700">{profile.email ?? 'Nėra'} {profile.email_verified_at ? '✓' : '⚠ nepatvirtintas'}</a></div></div>;
}
