import Link from 'next/link';
import { PlatePreview } from './PlatePreview';
import { AuctionCountdown } from './AuctionCountdown';
import type { FlagType, PlateType } from '@/lib/validation/listing';

export type AuctionSummary = {
  id: string; plate_text: string; plate_type: string; flag_type: string; city: string;
  current_price_eur: number; reserve_met: boolean; bid_count: number;
  starts_at: string; ends_at: string; status: string;
};

export function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const upcoming = new Date(auction.starts_at).getTime() > Date.now();
  const ended = auction.status === 'ended' || new Date(auction.ends_at).getTime() <= Date.now();
  return (
    <Link href={`/aukcionai/${auction.id}`} className="app-card group flex h-full flex-col overflow-hidden p-4 transition hover:border-[var(--primary)]">
      <div className="flex min-h-40 items-center justify-center rounded-2xl bg-[var(--muted)] p-4">
        <PlatePreview plateText={auction.plate_text} plateType={auction.plate_type as PlateType} flagType={auction.flag_type as FlagType} size="md" />
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-mono text-xl font-black tracking-wider text-[var(--foreground)]">{auction.plate_text}</h2>
          <span className="rounded-full bg-[color:color-mix(in_srgb,var(--primary)_12%,transparent)] px-2.5 py-1 text-xs font-black text-[var(--primary)]">
            {auction.bid_count} {auction.bid_count === 1 ? 'statymas' : 'statymų'}
          </span>
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">{ended ? 'Galutinė kaina' : 'Dabartinė kaina'}</p>
        <p className="text-2xl font-black text-[var(--foreground)]">€{auction.current_price_eur.toLocaleString('lt-LT')}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
          <span className="text-[var(--muted-foreground)]">{auction.city}</span>
          <strong className={ended ? 'text-[var(--muted-foreground)]' : 'text-amber-400'}>
            {upcoming ? 'Netrukus' : <AuctionCountdown endsAt={auction.ends_at} />}
          </strong>
        </div>
      </div>
    </Link>
  );
}
