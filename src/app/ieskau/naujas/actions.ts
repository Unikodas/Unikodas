'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { isLikelySpamDescription, parseWantedFormData } from '@/lib/validation/wanted';
import type { WantedFormState } from '@/components/WantedForm';

/**
 * Create a new wanted listing for the signed-in user.
 *
 * Same shape as parduoti/actions.ts:
 *   1. requireUser() — redirects if no session
 *   2. Parse + validate input
 *   3. Insert via the user-bound Supabase client. RLS policy
 *      `wanted_owner_insert` permits inserts only when
 *      `buyer_id = auth.uid()`, which we set explicitly.
 *   4. revalidate /ieskau, redirect to detail
 */
export async function createWantedAction(
  _prev: WantedFormState,
  formData: FormData,
): Promise<WantedFormState> {
  const { supabase, user } = await requireUser();

  let parsed;
  try {
    parsed = parseWantedFormData(formData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.issues[0]?.message ?? 'validation_error' };
    }
    return { error: 'validation_error' };
  }

  // Lightweight spam check on description: short or all-one-character
  // strings get rejected before they reach the DB.
  if (isLikelySpamDescription(parsed.description)) {
    return { error: 'spam_description' };
  }

  const { data, error } = await supabase
    .from('wanted_listings')
    .insert({
      buyer_id: user.id,
      plate_pattern: parsed.plate_pattern,
      description: parsed.description,
      max_price_eur: parsed.max_price_eur,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[ieskau/naujas] insert failed:', error);
    return { error: 'server_error' };
  }

  revalidatePath('/ieskau');
  redirect(`/ieskau/${data.id}`);
}
