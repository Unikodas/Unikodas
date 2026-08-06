import 'server-only';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { queueAuctionFinalizedNotifications, type AuctionFinalizedNotificationParams } from '@/lib/email/notifications';

type FinalizedAuctionRow = {
  auction_id: string;
  seller_id: string;
  winner_id: string | null;
  plate_text: string;
  final_price_eur: number;
  sold: boolean;
};

export async function finalizeExpiredAuctions(): Promise<FinalizedAuctionRow[]> {
  const { data, error } = await createServiceRoleClient().rpc('finalize_expired_auctions');
  if (error && error.code !== 'PGRST202') console.error('[auctions/finalize]', error);
  if (error) return [];
  const rows = (data ?? []) as FinalizedAuctionRow[];
  for (const row of rows) {
    queueAuctionFinalizedNotifications({
      auctionId: row.auction_id,
      sellerId: row.seller_id,
      winnerId: row.winner_id,
      plateText: row.plate_text,
      finalPriceEur: row.final_price_eur,
      sold: row.sold,
    } satisfies AuctionFinalizedNotificationParams);
  }
  return rows;
}
