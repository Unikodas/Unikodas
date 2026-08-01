import { NextResponse } from 'next/server';

import { getStripe, AUCTION_ENTRY_AMOUNT_CENTS, AUCTION_ENTRY_CURRENCY } from '@/lib/payments/stripe';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const sessionId = requestUrl.searchParams.get('session_id');
  const fallback = new URL('/aukcionai', requestUrl.origin);
  if (!sessionId) return NextResponse.redirect(fallback);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.redirect(new URL(`/prisijungti?redirect=${encodeURIComponent(requestUrl.pathname + requestUrl.search)}`, requestUrl.origin));
  }

  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const auctionId = session.metadata?.auction_id;
    const userId = session.metadata?.user_id;
    if (!auctionId || userId !== auth.user.id) return NextResponse.redirect(fallback);

    if (
      session.payment_status === 'paid' &&
      session.amount_total === AUCTION_ENTRY_AMOUNT_CENTS &&
      session.currency === AUCTION_ENTRY_CURRENCY
    ) {
      const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      await createServiceRoleClient().from('auction_participations').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        provider_payment_intent_id: paymentIntent ?? null,
      }).eq('provider_session_id', session.id).eq('auction_id', auctionId).eq('user_id', auth.user.id);
      return NextResponse.redirect(new URL(`/aukcionai/${auctionId}?payment=success`, requestUrl.origin));
    }

    return NextResponse.redirect(new URL(`/aukcionai/${auctionId}?payment=pending`, requestUrl.origin));
  } catch (error) {
    console.error('[auction/payment-confirm] failed:', error);
    return NextResponse.redirect(fallback);
  }
}
