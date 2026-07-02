import 'server-only';

import { Resend } from 'resend';

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

export type EmailEnvironmentStatus = {
  hasResendApiKey: boolean;
  hasNotificationFromEmail: boolean;
};

export function getEmailEnvironmentStatus(): EmailEnvironmentStatus {
  return {
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasNotificationFromEmail: Boolean(process.env.NOTIFICATION_FROM_EMAIL),
  };
}

/**
 * Server-only Resend email sender.
 *
 * Keep this module out of client components. It reads server env vars with no
 * NEXT_PUBLIC_ prefix and sends through Resend's API.
 */
export async function sendEmail({ to, subject, text }: SendEmailParams): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const envStatus = getEmailEnvironmentStatus();

  if (!apiKey || !from) {
    console.error('[email/resend] missing env vars:', envStatus);
    throw new Error('Missing Resend email configuration.');
  }

  const resend = new Resend(apiKey);
  const response = await resend.emails
    .send({
      from,
      to,
      subject,
      text,
    })
    .catch((err: unknown) => {
      console.error('[email/resend] send failure:', err);
      throw err;
    });

  const { data, error } = response;

  if (error) {
    console.error('[email/resend] send failure:', {
      name: error.name,
      statusCode: error.statusCode,
      message: error.message,
    });
    throw new Error(`Resend email request failed: ${error.message}`);
  }

  console.info('[email/resend] send success:', {
    emailId: data?.id ?? null,
  });
}
