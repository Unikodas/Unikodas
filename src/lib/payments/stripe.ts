import 'server-only';

import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is missing');
  stripe ??= new Stripe(secretKey);
  return stripe;
}

export const AUCTION_ENTRY_AMOUNT_CENTS = 200;
export const AUCTION_ENTRY_CURRENCY = 'eur' as const;
