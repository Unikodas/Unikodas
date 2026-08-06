import { NextRequest, NextResponse } from 'next/server';
import { finalizeExpiredAuctions } from '@/lib/auctions/finalize';

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized',{status:401});
  const finalized = await finalizeExpiredAuctions();
  return NextResponse.json({ finalized: finalized.length });
}
