import { createHmac, randomInt } from 'node:crypto';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;

/**
 * Generate a uniformly random 6-digit numeric code (zero-padded).
 * Uses crypto.randomInt so it's not predictable.
 */
export function generateOtpCode(): string {
  const n = randomInt(0, 10 ** OTP_LENGTH); // [0, 1_000_000)
  return String(n).padStart(OTP_LENGTH, '0');
}

/**
 * Hash an OTP code using HMAC-SHA256 with a server-only secret pepper.
 * Even if the otp_codes table is exfiltrated, the attacker can't grind
 * 6-digit codes without the pepper.
 *
 * The phone is included in the HMAC input so a hash from one phone
 * can't be reused for another.
 */
export function hashOtpCode(phoneE164: string, code: string): string {
  const pepper = process.env.OTP_HMAC_SECRET;
  if (!pepper || pepper.length < 16) {
    throw new Error(
      'OTP_HMAC_SECRET is missing or too short. Set a long random string in env.',
    );
  }
  return createHmac('sha256', pepper).update(`${phoneE164}:${code}`).digest('hex');
}

export const OTP_CONSTANTS = {
  LENGTH: OTP_LENGTH,
  TTL_MS: OTP_TTL_MS,
  MAX_ATTEMPTS: OTP_MAX_ATTEMPTS,
} as const;
