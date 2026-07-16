'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/require-user';
import { parseAuctionFormData } from '@/lib/validation/auction';

export type AuctionFormState = { error: string | null };

export async function createAuctionAction(_: AuctionFormState, formData: FormData): Promise<AuctionFormState> {
  const { supabase, user } = await requireUser('/aukcionai/naujas');
  const { data: profile } = await supabase.from('profiles')
    .select('email, email_verified_at, email_notifications_enabled')
    .eq('id', user.id)
    .maybeSingle<{ email: string | null; email_verified_at: string | null; email_notifications_enabled: boolean }>();
  if (!profile?.email || !profile.email_verified_at) {
    return { error: 'Prieš pateikdami aukcioną profilyje pridėkite ir patvirtinkite el. paštą.' };
  }
  if (profile.email_notifications_enabled !== true) {
    return { error: 'Prieš pateikdami aukcioną profilyje įjunkite el. pašto pranešimus.' };
  }
  let parsed;
  try { parsed = parseAuctionFormData(formData); }
  catch (error) { return { error: error instanceof z.ZodError ? error.issues[0]?.message ?? 'Patikrinkite duomenis.' : 'Patikrinkite duomenis.' }; }

  const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + parsed.duration_days * 86400000);
  const { data, error } = await supabase.from('auctions').insert({
    seller_id: user.id, plate_text: parsed.plate_text, plate_type: parsed.plate_type,
    flag_type: parsed.flag_type, city: parsed.city, description: parsed.description,
    start_price_eur: parsed.start_price_eur, reserve_price_eur: parsed.reserve_price_eur,
    current_price_eur: parsed.start_price_eur, starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), status: 'pending',
  }).select('id').single();
  if (error || !data) { console.error('[aukcionai/naujas] insert failed:', error); return { error: 'Nepavyko pateikti aukciono. Bandykite dar kartą.' }; }
  revalidatePath('/aukcionai');
  redirect(`/aukcionai/pateikta?id=${data.id}`);
}
