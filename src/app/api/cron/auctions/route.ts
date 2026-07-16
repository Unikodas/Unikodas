import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse('Unauthorized',{status:401});
  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc('finalize_expired_auctions');
  if (error) { console.error('[cron/auctions]',error); return NextResponse.json({error:'failed'},{status:500}); }
  return NextResponse.json({ finalized: data?.length ?? 0 });
}

