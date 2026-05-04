import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('[auth/signout] signOut failed:', error);
    return NextResponse.json({ error: 'signout_failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
