'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/require-user';
import { queueAuctionBidNotifications } from '@/lib/email/notifications';

export type BidState = { error: string | null; success: string | null };

const messages: Record<string, string> = {
  seller_cannot_bid: 'Negalite statyti savo aukcione.',
  auction_not_live: 'Šis aukcionas šiuo metu nevyksta.',
  bid_too_low: 'Maksimali suma per maža. Patikrinkite mažiausią galimą statymą.',
  invalid_bid: 'Įveskite tinkamą sumą.',
};

export async function placeBidAction(auctionId: string, _: BidState, formData: FormData): Promise<BidState> {
  const { supabase, user } = await requireUser(`/aukcionai/${auctionId}`);
  const { data: profile } = await supabase.from('profiles')
    .select('email, email_verified_at, email_notifications_enabled')
    .eq('id', user.id)
    .maybeSingle<{ email: string | null; email_verified_at: string | null; email_notifications_enabled: boolean }>();
  if (!profile?.email || !profile.email_verified_at || profile.email_notifications_enabled !== true) {
    return { error: 'Prieš statydami patvirtinkite el. paštą ir įjunkite pranešimus profilyje.', success: null };
  }
  const amount = Number(String(formData.get('max_amount_eur') ?? '').trim());
  if (!Number.isInteger(amount) || amount < 1 || amount > 999999) return { error: 'Įveskite tinkamą sumą.', success: null };
  const { data, error } = await supabase.rpc('place_auction_bid', { p_auction_id: auctionId, p_max_amount_eur: amount });
  if (error) {
    const code = Object.keys(messages).find((key) => error.message.includes(key));
    return { error: code ? messages[code] : 'Statymo pateikti nepavyko. Bandykite dar kartą.', success: null };
  }
  revalidatePath('/aukcionai'); revalidatePath(`/aukcionai/${auctionId}`);
  const result = Array.isArray(data) ? data[0] : null;
  const winning = result?.bidder_is_winning;
  if (result?.seller_id && result?.plate_text) {
    queueAuctionBidNotifications({
      sellerId: result.seller_id,
      bidderId: user.id,
      outbidBidderId: result.outbid_bidder_id ?? null,
      auctionId,
      plateText: result.plate_text,
      currentPriceEur: result.current_price_eur,
    });
  }
  return { error: null, success: winning ? 'Jūs šiuo metu pirmaujate.' : 'Statymas priimtas, tačiau kitas dalyvis turi didesnį automatinį statymą.' };
}
