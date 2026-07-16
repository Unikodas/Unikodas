'use client';

import { useActionState } from 'react';
import type { BidState } from '@/app/aukcionai/[id]/actions';

const initial: BidState = { error: null, success: null };

export function BidForm({ action, minimum }: { action: (state: BidState, data: FormData) => Promise<BidState>; minimum: number }) {
  const [state, formAction, pending] = useActionState(action, initial);
  return <form action={formAction} className="space-y-3">
    <label className="block"><span className="mb-1 block text-sm font-black text-[var(--foreground)]">Jūsų maksimali suma</span><div className="flex overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] focus-within:ring-2 focus-within:ring-[var(--ring)]"><span className="flex items-center px-4 font-black text-[var(--muted-foreground)]">€</span><input name="max_amount_eur" type="number" required min={minimum} max={999999} step={1} inputMode="numeric" className="min-w-0 flex-1 bg-transparent px-1 py-3 text-lg font-black outline-none" /></div><span className="mt-1 block text-xs text-[var(--muted-foreground)]">Mažiausia suma: €{minimum.toLocaleString('lt-LT')}. Jūsų maksimumas viešai nerodomas.</span></label>
    {state.error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-400">{state.error}</p>}
    {state.success && <p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm font-bold text-emerald-400">{state.success}</p>}
    <button disabled={pending} className="app-button-primary min-h-12 w-full px-5">{pending ? 'Statoma…' : 'Pateikti automatinį statymą'}</button>
    <p className="text-xs leading-5 text-[var(--muted-foreground)]">Pateikdami statymą įsipareigojate užbaigti sandorį, jei laimėsite.</p>
  </form>;
}

