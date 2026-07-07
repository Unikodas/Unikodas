'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { MessageBodySchema } from '@/lib/validation/message';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { queueNewMessageNotification } from '@/lib/email/notifications';
import { incrementListingCounter, recordListingEvent } from '@/lib/listing-analytics';
import type { MessageFormState } from './MessageForm';

/**
 * Send a direct message to the seller of a listing.
 *
 * Defense in depth:
 *   1. requireUser() — must be signed in.
 *   2. Recipient is read from the listing's seller_id on the server, NEVER
 *      from form data, so a malicious client can't smuggle a different
 *      recipient.
 *   3. App-level "no self-messaging" guard mirrors the DB CHECK
 *      constraint (sender_id <> recipient_id) for a friendlier error.
 *   4. Insert goes through the user-bound client, so RLS
 *      `messages_sender_insert` enforces sender_id = auth.uid() at the DB.
 *   5. Rate limit: 20 messages per signed-in user per hour.
 *
 * `listingId` is bound by the caller via `sendMessageAction.bind(null, id)`.
 */
export async function sendMessageAction(
  listingId: string,
  _prev: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const { supabase, user } = await requireUser();

  // Validate body
  const bodyRaw = String(formData.get('body') ?? '');
  let body: string;
  try {
    body = MessageBodySchema.parse(bodyRaw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { error: err.issues[0]?.message ?? 'validation_error' };
    }
    return { error: 'validation_error' };
  }

  // Rate-limit per user
  const ok = await bumpRateLimit({
    bucket: 'msg_send_user',
    key: user.id,
    ...RATE_LIMITS.MSG_SEND_PER_USER,
  });
  if (!ok.allowed) {
    return { error: 'rate_limited' };
  }

  // Read the listing to determine recipient. Messaging is only allowed
  // on active listings — sold and removed are both off-limits.
  // (Treating both the same way means the response shape doesn't leak
  // whether the listing was sold vs. removed vs. never existed.)
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('id, seller_id, status')
    .eq('id', listingId)
    .maybeSingle();

  if (listingError) {
    console.error('[messages/send] listing fetch failed:', listingError);
    return { error: 'server_error' };
  }
  if (!listing || listing.status !== 'active') {
    return { error: 'not_found' };
  }
  if (listing.seller_id === user.id) {
    return { error: 'cannot_message_self' };
  }

  const { error: insertError } = await supabase.from('messages').insert({
    listing_id: listingId,
    sender_id: user.id,
    recipient_id: listing.seller_id,
    body,
  });
  if (insertError) {
    console.error('[messages/send] insert failed:', insertError);
    return { error: 'server_error' };
  }

  await Promise.all([
    recordListingEvent(listingId, 'contact', {
      source: 'listing_detail_message_form',
    }),
    incrementListingCounter(listingId, 'contact_count'),
  ]);

  queueNewMessageNotification({
    recipientId: listing.seller_id,
    senderId: user.id,
  });

  revalidatePath('/zinutes');
  redirect('/zinutes');
}
