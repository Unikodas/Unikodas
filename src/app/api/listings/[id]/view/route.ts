import { NextRequest, NextResponse } from 'next/server';

import {
  incrementListingCounter,
  recordListingEvent,
} from '@/lib/listing-analytics';

const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ ok: false, error: 'invalid_listing_id' }, { status: 400 });
  }

  const cookieName = `unikodas_listing_view_${id}`;
  if (request.cookies.get(cookieName)?.value) {
    return NextResponse.json({ ok: true, counted: false });
  }

  await recordListingEvent(id, 'view', {
    source: 'listing_detail',
  });
  await incrementListingCounter(id, 'view_count');

  const response = NextResponse.json({ ok: true, counted: true });
  response.cookies.set(cookieName, '1', {
    httpOnly: true,
    maxAge: VIEW_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
