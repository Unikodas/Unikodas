import type { SmsProvider } from './provider';
import { lt } from '@/lib/i18n/lt';

/**
 * Twilio SMS provider.
 *
 * Talks to Twilio's REST API directly via fetch + Basic Auth, so we
 * don't add the `twilio` npm package as a dependency. Credentials are
 * read from process.env on each call and never logged.
 *
 * Selected when SMS_PROVIDER=twilio. The factory in provider.ts
 * caches the instance after first use, so config is effectively
 * read-once per server process.
 */

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/**
 * Read Twilio config from env. Throws a clear, sanitized error if any
 * required var is missing — the OTP route catches and returns its
 * generic `sms_failed` response, so the client never sees this message.
 */
function readTwilioConfig(): TwilioConfig {
  const clean = (value: string | undefined) =>
    value?.replace(/^\uFEFF/, '').trim();
  const accountSid = clean(process.env.TWILIO_ACCOUNT_SID);
  const authToken = clean(process.env.TWILIO_AUTH_TOKEN);
  const fromNumber = clean(process.env.TWILIO_PHONE_NUMBER);

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error(
      'twilio_misconfigured: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and ' +
        'TWILIO_PHONE_NUMBER must all be set when SMS_PROVIDER=twilio',
    );
  }

  return { accountSid, authToken, fromNumber };
}

/**
 * Compose the SMS body. Uses the brand name from i18n so a future
 * rebrand updates the SMS automatically. Kept short enough to fit in
 * one GSM-7 segment (160 chars) so we never split-bill an OTP.
 */
function buildOtpBody(code: string): string {
  return `${lt.appName} prisijungimo kodas: ${code}. Galioja 5 min.`;
}

/**
 * Pull a useful, non-sensitive summary out of a Twilio error response.
 * Twilio returns JSON like { code, message, more_info, status }; we
 * keep only `code` and `message` so logs aren't noisy.
 */
async function summariseTwilioError(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { code?: number; message?: string };
    return `code=${json.code ?? '?'} message="${json.message ?? '?'}"`;
  } catch {
    return '<unparseable response>';
  }
}

export const twilioSmsProvider: SmsProvider = {
  async sendOtp(phoneE164, code) {
    const { accountSid, authToken, fromNumber } = readTwilioConfig();

    const url = `${TWILIO_API_BASE}/Accounts/${encodeURIComponent(
      accountSid,
    )}/Messages.json`;

    // Basic Auth: SID:Token, base64-encoded.
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams({
      To: phoneE164,
      From: fromNumber,
      Body: buildOtpBody(code),
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
    } catch (err) {
      // Network-level failure (DNS, connect, TLS). Log the message but
      // not the request body (which contains the OTP code).
      const message = err instanceof Error ? err.message : 'unknown';
      console.error('[sms/twilio] network error:', message);
      throw new Error('twilio_network_error');
    }

    if (!response.ok) {
      const summary = await summariseTwilioError(response);
      console.error(
        `[sms/twilio] send failed: HTTP ${response.status} ${summary}`,
      );
      throw new Error(`twilio_send_failed_${response.status}`);
    }

    // Success path: deliberately do NOT read or log the response body.
    // Twilio echoes the request payload (including the OTP code) in
    // the success response.
  },
};
