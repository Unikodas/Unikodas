'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { MessageBodySchema } from '@/lib/validation/message';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import type { MessageFormState } from '@/app/skelbimas/[id]/MessageForm';

/**
 * Send a direct message to the author of a wanted listing.
 *
 * This deliberately reuses the existing messages table and inbox flow.
 * `wantedListingId` is only the conversation context; the recipient is
 * always derived server-side from wanted_listings.buyer_id.
 */
export async function sendWantedMessageAction(
  wantedListingId: string,
  _prev: MessageFormState,
  formData: FormData,
): Promise<MessageFormState> {
  const { supabase, user } = await requireUser();

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

  const ok = await bumpRateLimit({
    bucket: 'msg_send_user',
    key: user.id,
    ...RATE_LIMITS.MSG_SEND_PER_USER,
  });
  if (!ok.allowed) {
    return { error: 'rate_limited' };
  }

  const { data: wanted, error: wantedError } = await supabase
    .from('wanted_listings')
    .select('id, buyer_id, status')
    .eq('id', wantedListingId)
    .maybeSingle();

  if (wantedError) {
    console.error('[messages/send-wanted] wanted fetch failed:', wantedError);
    return { error: 'server_error' };
  }
  if (!wanted || wanted.status !== 'active') {
    return { error: 'not_found' };
  }
  if (wanted.buyer_id === user.id) {
    return { error: 'cannot_message_self' };
  }

  const { error: insertError } = await supabase.from('messages').insert({
    wanted_listing_id: wantedListingId,
    sender_id: user.id,
    recipient_id: wanted.buyer_id,
    body,
  });
  if (insertError) {
    console.error('[messages/send-wanted] insert failed:', insertError);
    return { error: 'server_error' };
  }

  revalidatePath('/zinutes');
  redirect('/zinutes');
}
