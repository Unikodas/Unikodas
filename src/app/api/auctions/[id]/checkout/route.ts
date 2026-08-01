import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCaptchaProvider } from '@/lib/captcha/provider';
import {
  AUCTION_ENTRY_AMOUNT_CENTS,
  AUCTION_ENTRY_CURRENCY,
  getStripe,
} from '@/lib/payments/stripe';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const BodySchema = z.object({
  captcha_token: z.string().min(1).max(4096),
  terms_accepted: z.literal(true),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: auctionId } = await params;
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'authentication_required' }, { status: 401 });

  const [{ data: profile }, { data: auction }] = await Promise.all([
    supabase.from('profiles')
      .select('phone,email,email_verified_at,email_notifications_enabled')
      .eq('id', auth.user.id).maybeSingle(),
    supabase.from('public_auctions')
      .select('id,seller_id,plate_text,status,starts_at,ends_at')
      .eq('id', auctionId).maybeSingle(),
  ]);

  if (!auction) return NextResponse.json({ error: 'auction_not_found' }, { status: 404 });
  if (auction.seller_id === auth.user.id) return NextResponse.json({ error: 'seller_cannot_join' }, { status: 400 });
  if (!['scheduled', 'live'].includes(auction.status) || new Date(auction.ends_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'auction_closed' }, { status: 400 });
  }
  if (!profile?.phone) return NextResponse.json({ error: 'phone_required' }, { status: 400 });
  if (!profile.email || !profile.email_verified_at) return NextResponse.json({ error: 'email_required' }, { status: 400 });
  if (profile.email_notifications_enabled !== true) {
    return NextResponse.json({ error: 'notifications_required' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  let captchaOk = false;
  try {
    captchaOk = await getCaptchaProvider().verifyToken(parsed.data.captcha_token, ip);
  } catch (error) {
    console.error('[auction/checkout] captcha verification failed:', error);
    return NextResponse.json({ error: 'captcha_failed' }, { status: 503 });
  }
  if (!captchaOk) return NextResponse.json({ error: 'captcha_failed' }, { status: 400 });

  const admin = createServiceRoleClient();
  const { data: existing } = await admin.from('auction_participations')
    .select('status,provider_session_id')
    .eq('auction_id', auctionId).eq('user_id', auth.user.id).maybeSingle();

  if (existing?.status === 'paid') {
    return NextResponse.json({ already_paid: true, redirect_url: `/aukcionai/${auctionId}` });
  }

  try {
    const stripe = getStripe();
    if (existing?.provider_session_id) {
      const oldSession = await stripe.checkout.sessions.retrieve(existing.provider_session_id);
      if (oldSession.status === 'open' && oldSession.url) {
        return NextResponse.json({ checkout_url: oldSession.url });
      }
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: profile.email,
      client_reference_id: auth.user.id,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: AUCTION_ENTRY_CURRENCY,
          unit_amount: AUCTION_ENTRY_AMOUNT_CENTS,
          product_data: { name: `Dalyvavimas ${auction.plate_text} aukcione` },
        },
      }],
      metadata: { auction_id: auctionId, user_id: auth.user.id },
      payment_intent_data: { metadata: { auction_id: auctionId, user_id: auth.user.id } },
      success_url: `${origin}/api/auctions/payments/confirm?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/aukcionai/${auctionId}?payment=cancelled`,
    });

    const { error } = await admin.from('auction_participations').upsert({
      auction_id: auctionId,
      user_id: auth.user.id,
      status: 'pending',
      amount_cents: AUCTION_ENTRY_AMOUNT_CENTS,
      currency: AUCTION_ENTRY_CURRENCY,
      provider: 'stripe',
      provider_session_id: session.id,
      terms_accepted_at: new Date().toISOString(),
      captcha_verified_at: new Date().toISOString(),
    }, { onConflict: 'auction_id,user_id' });
    if (error) throw error;

    return NextResponse.json({ checkout_url: session.url });
  } catch (error) {
    console.error('[auction/checkout] failed:', error);
    return NextResponse.json({ error: 'payment_unavailable' }, { status: 503 });
  }
}
