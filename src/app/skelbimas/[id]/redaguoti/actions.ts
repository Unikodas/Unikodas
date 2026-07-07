'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { parseListingFormData } from '@/lib/validation/listing';
import { recordPriceChange } from '@/lib/listing-analytics';
import type { ListingFormState } from '@/components/ListingForm';

/**
 * Update an existing listing.
 *
 * Defense in depth:
 *   - requireUser() ensures a session exists.
 *   - We re-fetch the row first to confirm ownership at the app layer
 *     (so we can return a helpful 'not_authorized' error instead of an
 *     opaque DB failure).
 *   - The actual UPDATE goes through the user-bound client, so the
 *     `listings_owner_update` RLS policy enforces ownership at the
 *     database too. Both layers must agree.
 *
 * `id` is bound by the caller via `updateListingAction.bind(null, id)`.
 */
export async function updateListingAction(
  id: string,
  _prev: ListingFormState,
  formData: FormData,
): Promise<ListingFormState> {
  const { supabase, user } = await requireUser();

  let parsed;
  try {
    parsed = parseListingFormData(formData);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.issues[0]?.message ?? 'validation_error' };
    }
    return { error: 'validation_error' };
  }

  // Confirm ownership before mutating.
  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('id, seller_id, price_eur')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('[redaguoti] fetch failed:', fetchError);
    return { error: 'server_error' };
  }
  if (!existing) {
    return { error: 'not_found' };
  }
  if (existing.seller_id !== user.id) {
    return { error: 'not_authorized' };
  }

  const { error: updateError } = await supabase
    .from('listings')
    .update({
      plate_text: parsed.plate_text,
      plate_type: parsed.plate_type,
      flag_type: parsed.flag_type,
      city: parsed.city,
      description: parsed.description,
      price_eur: parsed.price_eur,
    })
    .eq('id', id);

  if (updateError) {
    console.error('[redaguoti] update failed:', updateError);
    return { error: 'server_error' };
  }

  if (existing.price_eur !== parsed.price_eur) {
    await recordPriceChange(id, existing.price_eur, parsed.price_eur, user.id);
  }

  revalidatePath('/');
  revalidatePath(`/skelbimas/${id}`);
  redirect(`/skelbimas/${id}`);
}

/**
 * Delete a listing. Same defense-in-depth pattern as update.
 * Called from a Client Component button via useTransition.
 */
export async function deleteListingAction(id: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser();

  const { data: existing, error: fetchError } = await supabase
    .from('listings')
    .select('id, seller_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    console.error('[redaguoti] delete fetch failed:', fetchError);
    return { error: 'server_error' };
  }
  if (!existing) {
    return { error: 'not_found' };
  }
  if (existing.seller_id !== user.id) {
    return { error: 'not_authorized' };
  }

  // TODO: replace hard delete with a safe soft-remove outcome flow later
  // so removed_at/removal_reason and a persistent "removed" event can be kept.
  const { error: deleteError } = await supabase.from('listings').delete().eq('id', id);
  if (deleteError) {
    console.error('[redaguoti] delete failed:', deleteError);
    return { error: 'server_error' };
  }

  revalidatePath('/');
  redirect('/');
}
