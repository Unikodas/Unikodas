import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { hashToken } from '@/lib/email/verification';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const target = new URL('/profilis?email_verification=failed', request.url);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return NextResponse.redirect(target);

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();
  const { data } = await supabase.from('email_verification_tokens')
    .select('id, profile_id, email')
    .eq('token_hash', hashToken(token)).is('consumed_at', null).gt('expires_at', now)
    .maybeSingle<{ id: string; profile_id: string; email: string }>();
  if (!data) return NextResponse.redirect(target);

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', data.profile_id).maybeSingle<{ email: string | null }>();
  if (profile?.email?.toLowerCase() !== data.email.toLowerCase()) return NextResponse.redirect(target);

  const { error } = await supabase.from('profiles').update({ email_verified_at: now }).eq('id', data.profile_id);
  if (error) return NextResponse.redirect(target);
  await supabase.from('email_verification_tokens').update({ consumed_at: now }).eq('id', data.id);
  return NextResponse.redirect(new URL('/profilis?email_verification=success', request.url));
}
