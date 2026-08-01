'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Turnstile } from '@/components/Turnstile';

type Props = {
  auctionId: string;
  isSignedIn: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  notificationsEnabled: boolean;
};

const errors: Record<string, string> = {
  authentication_required: 'Pirmiausia prisijunkite.',
  phone_required: 'Pirmiausia patvirtinkite telefono numerį SMS kodu.',
  email_required: 'Pirmiausia pridėkite ir patvirtinkite el. paštą.',
  notifications_required: 'Profilyje įjunkite el. pašto pranešimus.',
  captcha_failed: 'Nepavyko patvirtinti CAPTCHA. Bandykite dar kartą.',
  auction_closed: 'Registracija į šį aukcioną uždaryta.',
  payment_unavailable: 'Mokėjimas šiuo metu nepasiekiamas. Bandykite vėliau.',
};

export function AuctionJoinPanel(props: Props) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVersion, setCaptchaVersion] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = props.isSignedIn && props.phoneVerified && props.emailVerified && props.notificationsEnabled;

  async function checkout() {
    if (!accepted || !captchaToken || !ready || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/auctions/${props.auctionId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captcha_token: captchaToken, terms_accepted: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'payment_unavailable');
      window.location.assign(data.checkout_url ?? data.redirect_url ?? `/aukcionai/${props.auctionId}`);
    } catch (caught) {
      const code = caught instanceof Error ? caught.message : 'payment_unavailable';
      setError(errors[code] ?? errors.payment_unavailable);
      setCaptchaToken(null);
      setCaptchaVersion((value) => value + 1);
      setPending(false);
    }
  }

  return <section className="space-y-4" aria-labelledby="auction-entry-title">
    <div>
      <h2 id="auction-entry-title" className="text-xl font-black text-[var(--foreground)]">Prisijungti prie aukciono</h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">Atlikite patikrinimus ir vieną kartą sumokėkite €2 už dalyvavimą šiame aukcione.</p>
    </div>

    <ol className="space-y-2 text-sm">
      <Check done={props.isSignedIn} label="Prisijungta prie paskyros" />
      <Check done={props.phoneVerified} label="Telefono numeris patvirtintas SMS" />
      <Check done={props.emailVerified} label="El. paštas patvirtintas" />
      <Check done={props.notificationsEnabled} label="Aukciono pranešimai įjungti" />
    </ol>

    {!props.isSignedIn ? <Link href={`/prisijungti?redirect=${encodeURIComponent(`/aukcionai/${props.auctionId}`)}`} className="app-button-primary flex min-h-12 w-full px-5">Prisijungti ir tęsti</Link> : !ready ? <Link href="/profilis" className="app-button-primary flex min-h-12 w-full px-5">Užbaigti patvirtinimą profilyje</Link> : <>
      <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
        <strong className="block text-base text-amber-300">Svarbu: €2 mokestis yra galutinis</strong>
        Dalyvavimo mokestis įprastai negrąžinamas, net jei nepastatysite arba nelaimėsite. Jis grąžinamas tik Unikodui atšaukus aukcioną arba dėl patvirtintos platformos techninės klaidos.
      </div>
      <label className="flex items-start gap-3 rounded-2xl bg-[var(--muted)] p-4 text-sm leading-6 text-[var(--muted-foreground)]">
        <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-1" />
        <span>Prašau iš karto aktyvuoti dalyvavimą šiame aukcione. Suprantu, kad statymai yra įpareigojantys, paslauga pradedama teikti iš karto, o €2 mokestis įprastai negrąžinamas.</span>
      </label>
      <Turnstile key={captchaVersion} onToken={setCaptchaToken} />
      {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm font-bold text-red-400">{error}</p>}
      <button type="button" onClick={checkout} disabled={!accepted || !captchaToken || pending} className="app-button-primary min-h-12 w-full px-5 disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? 'Atidaromas mokėjimas…' : 'Sumokėti €2 ir prisijungti'}
      </button>
      <p className="text-center text-xs text-[var(--muted-foreground)]">Saugus mokėjimas atliekamas išoriniame Stripe mokėjimo lange.</p>
    </>}
  </section>;
}

function Check({ done, label }: { done: boolean; label: string }) {
  return <li className="flex items-center gap-2 rounded-xl bg-[var(--muted)] px-3 py-2">
    <span className={done ? 'text-emerald-400' : 'text-amber-400'} aria-hidden="true">{done ? '✓' : '!'}</span>
    <span className="text-[var(--foreground)]">{label}</span>
  </li>;
}
