import type { CaptchaProvider } from './provider';

/**
 * Dev-only CAPTCHA provider. Accepts any token (including empty).
 * Refuses to operate unless CAPTCHA_DEV_MODE=true so an accidental
 * production deploy fails loud rather than silently letting bots in.
 */
export const stubCaptchaProvider: CaptchaProvider = {
  async verifyToken() {
    if (process.env.CAPTCHA_DEV_MODE !== 'true') {
      throw new Error(
        'Stub CAPTCHA provider invoked without CAPTCHA_DEV_MODE=true. ' +
          'Configure a real provider (Turnstile / hCaptcha) before going to production.',
      );
    }
    return true;
  },
};
