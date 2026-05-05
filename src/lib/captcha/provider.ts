/**
 * CAPTCHA provider seam.
 *
 * Mirrors the SMS provider pattern: today only the dev stub is wired up.
 * Real provider implementations live behind this interface so call sites
 * don't change when we switch to Cloudflare Turnstile / hCaptcha.
 *
 * Verification happens server-side. The browser obtains a token from the
 * captcha widget and includes it in the OTP request body; the server
 * calls verifyToken() to confirm.
 */

export interface CaptchaProvider {
  /**
   * Verify a captcha token. Returns true if valid, false otherwise.
   * The IP is forwarded to the provider when supported (Turnstile +
   * hCaptcha both accept it for additional fraud signals).
   *
   * Implementations MUST NOT throw on a "user failed CAPTCHA" outcome —
   * only on hard infrastructure failures (network, misconfiguration).
   */
  verifyToken(token: string, ip?: string): Promise<boolean>;
}

import { stubCaptchaProvider } from './stub';
import { turnstileCaptchaProvider } from './turnstile';

let cached: CaptchaProvider | null = null;

export function getCaptchaProvider(): CaptchaProvider {
  if (cached) return cached;

  const which = (process.env.CAPTCHA_PROVIDER ?? 'stub').toLowerCase();

switch (which) {
  case 'stub':
    cached = stubCaptchaProvider;
    break;

  case 'turnstile':
    cached = turnstileCaptchaProvider;
    break;

  default:
    throw new Error(
      `Unknown CAPTCHA_PROVIDER="${which}". Set CAPTCHA_PROVIDER=stub for dev.`,
    );
}

  if (!cached) {
  throw new Error('CAPTCHA provider was not initialized');
}

return cached;;
}
