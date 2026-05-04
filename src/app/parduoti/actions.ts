'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { parseListingFormData } from '@/lib/validation/listing';
import type { ListingFormState } from '@/components/ListingForm';

/**
 * Create a new listing for the signed-in user.
 *
 * Order of operations matters:
 *   1. requireUser() (redirects if no session)
 *   2. Parse + validate input
 *   3. Insert via the user-bound Supabase client. RLS policy
 *      `listings_owner_insert` permits inserts only when
 *      `seller_id = auth.uid()`, which we set explicitly.
 *   4. revalidate /, redirect to detail
 *
 * On any error we return a state object with an i18n error code; the
 * client form maps that to a Lithuanian message via lt.listings.errors.
 */
export async function createListingAction(
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

  const { data, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      plate_text: parsed.plate_text,
      plate_type: parsed.plate_type,
      flag_type: parsed.flag_type,
      city: parsed.city,
      description: parsed.description,
      price_eur: parsed.price_eur,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('[parduoti] insert failed:', error);
    return { error: 'server_error' };
  }

  revalidatePath('/');
  redirect(`/skelbimas/${data.id}`);
}
