'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { MessageBodySchema } from '@/lib/validation/message';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import type { ReplyFormState } from './ReplyButton';

/**
 * Reply to a received message from the inbox.
 *
 * Defense in depth:
 *   - requireUser() — must be signed in.
 *   - Recipient is derived server-side from the original message's
 *     sender_id, NEVER from form data, so a malicious client can't
 *     smuggle a different recipient.
 *   - We re-fetch the original message via the user-bound client; RLS
 *     `messages_participant_read` already restricts that read to
 *     conversations we're part of. We additionally require we were
 *     the recipient — RLS can't distinguish "reply to a received
 *     message" from "reply to my own outgoing message", so we do.
 *   - Insert goes through the user-bound client too; RLS
 *     `messages_sender_insert` enforces sender_id = auth.uid() at the DB.
 *   - Rate-limited under the same MSG_SEND_PER_USER bucket as the
 *     listing-detail compose action, so replies count toward the same
 *     hourly cap.
 *
 * `originalMessageId` is bound by the caller via
 * `replyToMessageAction.bind(null, msg.id)`.
 *
 * Note: we deliberately do NOT block replies on listings with
 * status='removed'. A continuing conversation about a delisted plate
 * is still useful for both parties; only the initial outreach is
 * gated on listing.status === 'active' (in skelbimas/[id]/actions.ts).
 */
export async function replyToMessageAction(
  originalMessageId: string,
  _prev: ReplyFormState,
  formData: FormData,
): Promise<ReplyFormState> {
  const { supabase, user } = await requireUser();

  // Validate body
  const bodyRaw = String(formData.get('body') ?? '');
  let body: string;
  try {
    body = MessageBodySchema.parse(bodyRaw);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        error: err.issues[0]?.message ?? 'validation_error',
        success: false,
      };
    }
    return { error: 'validation_error', success: false };
  }

  // Rate-limit (shared bucket with the compose action).
  const ok = await bumpRateLimit({
    bucket: 'msg_send_user',
    key: user.id,
    ...RATE_LIMITS.MSG_SEND_PER_USER,
  });
  if (!ok.allowed) {
    return { error: 'rate_limited', success: false };
  }

  // Look up the original message. The user-bound client + RLS
  // restricts this to messages we're a participant of; the explicit
  // recipient check below ensures we were the *recipient*, not the
  // sender (you don't reply to your own outgoing messages).
  const { data: original, error: lookupError } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, listing_id')
    .eq('id', originalMessageId)
    .maybeSingle();

  if (lookupError) {
    console.error('[zinutes/reply] lookup failed:', lookupError);
    return { error: 'server_error', success: false };
  }
  if (!original) {
    return { error: 'not_found', success: false };
  }
  if (original.recipient_id !== user.id) {
    return { error: 'not_authorized', success: false };
  }
  // Mirrors the DB CHECK (sender_id <> recipient_id) for a friendlier
  // error. In practice unreachable given the recipient check above.
  if (original.sender_id === user.id) {
    return { error: 'cannot_message_self', success: false };
  }

  const { error: insertError } = await supabase.from('messages').insert({
    listing_id: original.listing_id,   // preserve the conversation context
    sender_id: user.id,
    recipient_id: original.sender_id,  // reply goes to whoever sent us the original
    body,
  });

  if (insertError) {
    console.error('[zinutes/reply] insert failed:', insertError);
    return { error: 'server_error', success: false };
  }

  revalidatePath('/zinutes');
  return { error: null, success: true };
}
