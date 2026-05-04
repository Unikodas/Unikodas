'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { isLikelySpamDescription, parseWantedFormData } from '@/lib/validation/wanted';
import type { WantedFormState } from '@/components/WantedForm';

/**
 * Update an existing wanted listing.
 *
 * Defense in depth (mirrors skelbimas/[id]/redaguoti/actions.ts):
 *   - requireUser() ensures a session exists.
 *   - We re-fetch the row to confirm ownership at the app layer so we
 *     can return a meaningful 'not_authorized' error.
 *   - The UPDATE goes through the user-bound client, so RLS
 *     `wanted_owner_update` is the floor.
 *
 * `id` is bound by the caller via `updateWantedAction.bind(null, id)`.
 */
export async function updateWantedAction(
  id: string,
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

  // Same lightweight spam check as create.
  if (isLikelySpamDescription(parsed.description)) {
    return { error: 'spam_description' };
  }

  const { data: existing, error: fetchError } = await supabase
    .from('wanted_listings')
    .select('id, buyer_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('[ieskau/redaguoti] fetch failed:', fetchError);
    return { error: 'server_error' };
  }
  if (!existing) {
    return { error: 'not_found' };
  }
  if (existing.buyer_id !== user.id) {
    return { error: 'not_authorized' };
  }

  const { error: updateError } = await supabase
    .from('wanted_listings')
    .update({
      plate_pattern: parsed.plate_pattern,
      description: parsed.description,
      max_price_eur: parsed.max_price_eur,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[ieskau/redaguoti] update failed:', updateError);
    return { error: 'server_error' };
  }

  revalidatePath('/ieskau');
  revalidatePath(`/ieskau/${id}`);
  redirect(`/ieskau/${id}`);
}

/**
 * Delete a wanted listing. Same defense-in-depth pattern.
 */
export async function deleteWantedAction(
  id: string,
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { data: existing, error: fetchError } = await supabase
    .from('wanted_listings')
    .select('id, buyer_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('[ieskau/redaguoti] delete fetch failed:', fetchError);
    return { error: 'server_error' };
  }
  if (!existing) {
    return { error: 'not_found' };
  }
  if (existing.buyer_id !== user.id) {
    return { error: 'not_authorized' };
  }

  const { error: deleteError } = await supabase
    .from('wanted_listings')
    .delete()
    .eq('id', id);
  if (deleteError) {
    console.error('[ieskau/redaguoti] delete failed:', deleteError);
    return { error: 'server_error' };
  }

  revalidatePath('/ieskau');
  redirect('/ieskau');
}
