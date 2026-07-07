'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireUser } from '@/lib/auth/require-user';
import { MessageBodySchema } from '@/lib/validation/message';
import { bumpRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { queueNewMessageNotification } from '@/lib/email/notifications';
import { recordListingEvent } from '@/lib/listing-analytics';
import { makeMessageThreadKey, parseMessageThreadKey } from '@/lib/messages/thread-key';
import type { ReplyFormState } from './ReplyButton';

export type ConversationMessageFormState = { error: string | null; success: boolean };

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
 * status='removed' or wanted listings with status='removed'. A continuing
 * conversation is still useful for both parties; only the initial outreach
 * is gated by the detail-page compose actions.
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
    .select('id, sender_id, recipient_id, listing_id, wanted_listing_id')
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
    listing_id: original.listing_id,
    wanted_listing_id: original.wanted_listing_id,
    sender_id: user.id,
    recipient_id: original.sender_id,
    body,
  });

  if (insertError) {
    console.error('[zinutes/reply] insert failed:', insertError);
    return { error: 'server_error', success: false };
  }

  if (original.listing_id) {
    await recordListingEvent(original.listing_id, 'message', {
      source: 'inbox_reply',
    });
  }

  queueNewMessageNotification({
    recipientId: original.sender_id,
    senderId: user.id,
  });

  revalidatePath('/zinutes');
  return { error: null, success: true };
}

export async function sendConversationMessageAction(
  threadKey: string,
  _prev: ConversationMessageFormState,
  formData: FormData,
): Promise<ConversationMessageFormState> {
  const { supabase, user } = await requireUser('/zinutes');
  const thread = parseMessageThreadKey(threadKey);

  if (!thread || thread.otherId === user.id) {
    return { error: 'not_authorized', success: false };
  }

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

  const ok = await bumpRateLimit({
    bucket: 'msg_send_user',
    key: user.id,
    ...RATE_LIMITS.MSG_SEND_PER_USER,
  });
  if (!ok.allowed) {
    return { error: 'rate_limited', success: false };
  }

  const { data: visibleMessages, error: lookupError } = await supabase
    .from('messages')
    .select('id, sender_id, recipient_id, listing_id, wanted_listing_id')
    .order('created_at', { ascending: false })
    .limit(200);

  if (lookupError) {
    console.error('[zinutes/conversation-send] lookup failed:', lookupError);
    return { error: 'server_error', success: false };
  }

  const matchingThread = (visibleMessages ?? []).find((message) => {
    const otherId = message.sender_id === user.id ? message.recipient_id : message.sender_id;
    return (
      makeMessageThreadKey({
        otherId,
        listingId: message.listing_id,
        wantedListingId: message.wanted_listing_id,
      }) === threadKey
    );
  });

  if (!matchingThread) {
    return { error: 'not_authorized', success: false };
  }

  const { error: insertError } = await supabase.from('messages').insert({
    listing_id: thread.listingId,
    wanted_listing_id: thread.wantedListingId,
    sender_id: user.id,
    recipient_id: thread.otherId,
    body,
  });

  if (insertError) {
    console.error('[zinutes/conversation-send] insert failed:', insertError);
    return { error: 'server_error', success: false };
  }

  if (thread.listingId) {
    await recordListingEvent(thread.listingId, 'message', {
      source: 'conversation_composer',
    });
  }

  queueNewMessageNotification({
    recipientId: thread.otherId,
    senderId: user.id,
  });

  revalidatePath('/zinutes');
  return { error: null, success: true };
}
