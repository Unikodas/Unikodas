import { z } from 'zod';
import { normalizeLithuanianMobile } from './phone';

export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 30;

/**
 * Returns true if the input contains a phone-number-like sequence.
 *
 * Two layered checks:
 *   1. Precise: try to parse the input as a Lithuanian mobile in any
 *      accepted format. If it parses, it IS a phone number — flag it.
 *      Catches "+37061234567", "8 612 34 567", "37061234567",
 *      and even bare subscriber form "61234567".
 *   2. Fallback: if 9+ digits remain after stripping non-digits, treat
 *      as phone-like. Catches obfuscated phones with extra characters
 *      that the precise parser rejected.
 *
 * Lets through:
 *   "Audi 2024 fan"        → no parse, 4 digits   → false
 *   "Žaibas99"             → no parse, 2 digits   → false
 *   "Vartotojas-3a9f7c1d"  → no parse, 4 digits   → false
 *   "Volkswagen"           → no parse, 0 digits   → false
 *
 * The auto-generated default ("Vartotojas-XXXXXXXX") never trips
 * either check — the suffix has at most 8 digits and doesn't parse
 * as a phone.
 */
export function looksLikePhoneNumber(s: string): boolean {
  if (normalizeLithuanianMobile(s) !== null) return true;
  return s.replace(/\D/g, '').length >= 9;
}

/**
 * Display name validation. Trimmed, 2–30 chars, no phone numbers.
 *
 * The trim happens at parse time (not via z.string().trim()) because
 * we want the consumer to see the cleaned value with confidence.
 */
export const DisplayNameSchema = z
  .string()
  .min(DISPLAY_NAME_MIN, 'display_name_too_short')
  .max(DISPLAY_NAME_MAX, 'display_name_too_long')
  .refine((s) => !looksLikePhoneNumber(s), {
    message: 'display_name_contains_phone',
  });

/**
 * Parse a Server Action FormData payload into a validated display name.
 * Throws ZodError on validation failure.
 */
export function parseDisplayNameFormData(formData: FormData): string {
  const trimmed = String(formData.get('display_name') ?? '').trim();
  return DisplayNameSchema.parse(trimmed);
}
