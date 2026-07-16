'use client';

import { useActionState } from 'react';
import { FLAG_TYPES, PLATE_TYPES } from '@/lib/validation/listing';
import { LITHUANIAN_CITIES } from '@/lib/locations/lithuania-cities';
import type { AuctionFormState } from '@/app/aukcionai/naujas/actions';
import { lt } from '@/lib/i18n/lt';

const field = 'w-full rounded-2xl border border-[var(--border-strong)] bg-[var(--input)] px-3 py-3 text-base text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]';
const initial: AuctionFormState = { error: null };

export function AuctionForm({ action }: { action: (state: AuctionFormState, data: FormData) => Promise<AuctionFormState> }) {
  const [state, formAction, pending] = useActionState(action, initial);
  return <form action={formAction} className="space-y-4">
    <section className="app-card space-y-4 p-5">
      <h2 className="text-lg font-black text-[var(--foreground)]">Numeris</h2>
      <label className="block"><span className="mb-1 block text-sm font-bold">Numerio tekstas</span><input name="plate_text" required maxLength={20} className={`${field} font-mono uppercase`} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="mb-1 block text-sm font-bold">Numerio tipas</span><select name="plate_type" className={field}>{PLATE_TYPES.map((value) => <option key={value} value={value}>{lt.listings.types[value]}</option>)}</select></label>
        <label><span className="mb-1 block text-sm font-bold">Simbolis</span><select name="flag_type" className={field}>{FLAG_TYPES.map((value) => <option key={value} value={value}>{lt.listings.flagTypes[value]}</option>)}</select></label>
      </div>
      <label className="block"><span className="mb-1 block text-sm font-bold">Miestas</span><select name="city" required defaultValue="" className={field}><option value="" disabled>Pasirinkite</option>{LITHUANIAN_CITIES.map((city) => <option key={city}>{city}</option>)}</select></label>
      <label className="block"><span className="mb-1 block text-sm font-bold">Aprašymas</span><textarea name="description" maxLength={2000} rows={5} className={field} /></label>
    </section>
    <section className="app-card space-y-4 p-5">
      <h2 className="text-lg font-black text-[var(--foreground)]">Aukciono sąlygos</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label><span className="mb-1 block text-sm font-bold">Pradinė kaina (€)</span><input type="number" name="start_price_eur" min={1} max={999999} required className={field} /></label>
        <label><span className="mb-1 block text-sm font-bold">Rezervinė kaina (€)</span><input type="number" name="reserve_price_eur" min={1} max={999999} className={field} /><span className="mt-1 block text-xs text-[var(--muted-foreground)]">Neprivaloma ir pirkėjams nerodoma.</span></label>
      </div>
      <label className="block"><span className="mb-1 block text-sm font-bold">Trukmė</span><select name="duration_days" defaultValue="5" className={field}><option value="3">3 dienos</option><option value="5">5 dienos</option><option value="7">7 dienos</option></select></label>
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-6 text-[var(--muted-foreground)]">Pateikimas aukciono iškart nepaskelbia. Komanda patikrins numerį, nuosavybę ir suderins tikslią pradžios datą.</div>
      {state.error && <p role="alert" className="text-sm font-bold text-red-500">{state.error}</p>}
      {state.error?.includes('profilyje') && <a href="/profilis#pranesimai" className="app-button-secondary flex min-h-11 items-center justify-center px-4 text-sm">Atidaryti profilio nustatymus</a>}
      <button disabled={pending} className="app-button-primary min-h-12 w-full px-5">{pending ? 'Pateikiama…' : 'Pateikti peržiūrai'}</button>
    </section>
  </form>;
}
