import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { recordListingEvent } from '@/lib/listing-analytics';

const BodySchema = z.object({
  placement: z.enum(['hero', 'listing', 'empty_search', 'footer']),
  listingId: z.string().uuid().optional(),
  destination: z.literal('telegram'),
});

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof BodySchema>;
  try {
    parsed = BodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  if (parsed.listingId) {
    await recordListingEvent(parsed.listingId, 'shared', {
      destination: parsed.destination,
      placement: parsed.placement,
      source: 'community_cta',
    });
  } else {
    console.info('[community-click]', {
      destination: parsed.destination,
      placement: parsed.placement,
    });
  }

  return NextResponse.json({ ok: true });
}
