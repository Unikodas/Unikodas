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

type AuctionBidNotificationParams = {
  sellerId: string;
  bidderId: string;
  outbidBidderId: string | null;
  auctionId: string;
  plateText: string;
  currentPriceEur: number;
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

async function sendTransactionalNotification(recipientId: string, subject: string, text: string) {
  const supabase = createServiceRoleClient();
  const { data: recipient, error } = await supabase.from('profiles')
    .select('email, email_verified_at, email_notifications_enabled')
    .eq('id', recipientId)
    .maybeSingle<RecipientEmailSettings & { email_verified_at: string | null }>();
  if (error) throw new Error(`Recipient email lookup failed: ${error.message}`);
  if (!recipient?.email || !recipient.email_verified_at || recipient.email_notifications_enabled !== true) return;
  await sendEmail({ to: recipient.email, subject, text });
}

export function queueAuctionBidNotifications(params: AuctionBidNotificationParams): void {
  try {
    after(async () => {
      const auctionUrl = `https://unikodas.lt/aukcionai/${params.auctionId}`;
      const price = params.currentPriceEur.toLocaleString('lt-LT');
      try {
        await sendTransactionalNotification(
          params.sellerId,
          `Naujas statymas už ${params.plateText}`,
          `Sveiki,\n\nJūsų numerio ${params.plateText} aukcione atliktas naujas statymas.\nDabartinė kaina: €${price}\n\nPeržiūrėti aukcioną:\n${auctionUrl}`,
        );
      } catch (error) {
        console.error('[email/auction] seller notification failed:', error);
      }
      if (params.outbidBidderId && params.outbidBidderId !== params.bidderId) {
        try {
          await sendTransactionalNotification(
            params.outbidBidderId,
            `Jūsų statymas už ${params.plateText} aplenktas`,
            `Sveiki,\n\nKitas dalyvis aplenkė jūsų statymą numerio ${params.plateText} aukcione.\nDabartinė kaina: €${price}\n\nJei norite tęsti, pateikite naują maksimalų statymą:\n${auctionUrl}`,
          );
        } catch (error) {
          console.error('[email/auction] outbid notification failed:', error);
        }
      }
    });
  } catch (error) {
    console.error('[email/auction] scheduling failed:', error);
  }
}
