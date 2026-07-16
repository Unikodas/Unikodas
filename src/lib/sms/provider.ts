/**
 * SMS provider seam.
 *
 * Today: only the dev stub is wired up.
 * Later: select via SMS_PROVIDER env (e.g. "twilio", "vonage", "stub").
 * Call sites (the OTP request route) only depend on this interface,
 * so swapping providers is a one-file change.
 */

export interface SmsProvider {
  /** Send a one-time code to a phone number. Throws on hard failure. */
  sendOtp(phoneE164: string, code: string): Promise<void>;
}

import { stubSmsProvider } from './stub';
import { twilioSmsProvider } from './twilio';

let cached: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (cached) return cached;

  const which = (process.env.SMS_PROVIDER ?? 'stub')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();
  switch (which) {
    case 'stub':
      cached = stubSmsProvider;
      break;
    case 'twilio':
      cached = twilioSmsProvider;
      break;
    default:
      throw new Error(`Unknown SMS_PROVIDER="${which}". Set SMS_PROVIDER=stub or twilio.`);
  }

  return cached;
}
