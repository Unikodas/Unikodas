import Link from 'next/link';
import { LogoLink } from '@/components/LogoLink';
import { AuctionForm } from '@/components/AuctionForm';
import { createAuctionAction } from './actions';

export default function NewAuctionPage() {
  return <><header className="app-header sticky top-0 z-40"><nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6"><LogoLink /><Link href="/aukcionai" className="text-sm font-bold text-[var(--muted-foreground)]">Atgal</Link></nav></header><main className="app-shell mx-auto min-h-screen max-w-2xl px-4 py-6 sm:px-6"><h1 className="text-3xl font-black text-[var(--foreground)]">Pateikti numerį aukcionui</h1><p className="mb-6 mt-2 text-[var(--muted-foreground)]">Patikrinsime informaciją prieš paskelbdami aukcioną.</p><AuctionForm action={createAuctionAction} /></main></>;
}

