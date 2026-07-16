'use client';
import { useTransition } from 'react';
import { approveAuctionAction, rejectAuctionAction } from './auction-actions';

export function AuctionRowActions({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return <div className="flex flex-wrap gap-2">
    <button disabled={pending} onClick={() => start(() => approveAuctionAction(id))} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Patvirtinti ir paleisti rytoj</button>
    <button disabled={pending} onClick={() => start(() => rejectAuctionAction(id))} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50">Atmesti</button>
  </div>;
}

