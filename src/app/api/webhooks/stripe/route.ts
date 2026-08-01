import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { AUCTION_ENTRY_AMOUNT_CENTS, AUCTION_ENTRY_CURRENCY, getStripe } from '@/lib/payments/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!signature || !webhookSecret) return new NextResponse('Webhook configuration missing', { status: 400 });

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('[stripe/webhook] invalid signature:', error);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session;
    const auctionId = session.metadata?.auction_id;
    const userId = session.metadata?.user_id;
    if (
      auctionId && userId && session.payment_status === 'paid' &&
      session.amount_total === AUCTION_ENTRY_AMOUNT_CENTS &&
      session.currency === AUCTION_ENTRY_CURRENCY
    ) {
      const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      const { error } = await createServiceRoleClient().from('auction_participations').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        provider_payment_intent_id: paymentIntent ?? null,
      }).eq('provider_session_id', session.id).eq('auction_id', auctionId).eq('user_id', userId);
      if (error) {
        console.error('[stripe/webhook] participation update failed:', error);
        return new NextResponse('Database update failed', { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
