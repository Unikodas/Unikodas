import 'server-only';

import { after } from 'next/server';

import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from './resend';

const NEW_MESSAGE_SUBJECT = 'Nauja žinutė Unikodas.lt';

const NEW_MESSAGE_BODY = `Sveiki,

Gavote naują žinutę Unikodas.lt platformoje.

Prisijunkite ir atsakykite:
https://unikodas.lt/zinutes

Jei nenorite gauti šių pranešimų, galite juos išjungti profilio nustatymuose.`;

type NewMessageNotificationParams = {
  recipientId: string;
  senderId: string;
};

type RecipientEmailSettings = {
  email: string | null;
  email_notifications_enabled: boolean | null;
};

function logContext({ recipientId, senderId }: NewMessageNotificationParams) {
  return { recipientId, senderId };
}

export function queueNewMessageNotification(params: NewMessageNotificationParams): void {
  if (params.recipientId === params.senderId) {
    console.info('[email/new-message] skipped: self-message', logContext(params));
    return;
  }

  try {
    after(() => sendNewMessageNotification(params));
    console.info('[email/new-message] queued', logContext(params));
  } catch (err) {
    console.error('[email] new message notification scheduling failed:', err);
  }
}

export async function sendNewMessageNotification({
  recipientId,
  senderId,
}: NewMessageNotificationParams): Promise<void> {
  const context = logContext({ recipientId, senderId });

  if (recipientId === senderId) {
    console.info('[email/new-message] skipped: self-message', context);
    return;
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: recipient, error } = await supabase
      .from('profiles')
      .select('email, email_notifications_enabled')
      .eq('id', recipientId)
      .maybeSingle<RecipientEmailSettings>();

    if (error) {
      throw new Error(`Recipient email settings lookup failed: ${error.message}`);
    }

    if (!recipient) {
      console.info('[email/new-message] skipped: recipient profile missing', context);
      return;
    }

    const email = recipient.email?.trim();
    if (!email) {
      console.info('[email/new-message] skipped: missing recipient email', context);
      return;
    }
    if (recipient.email_notifications_enabled !== true) {
      console.info('[email/new-message] skipped: notifications disabled', context);
      return;
    }

    console.info('[email/new-message] sending', context);
    await sendEmail({
      to: email,
      subject: NEW_MESSAGE_SUBJECT,
      text: NEW_MESSAGE_BODY,
    });
    console.info('[email/new-message] sent', context);
  } catch (err) {
    console.error('[email] new message notification failed:', err);
  }
}
