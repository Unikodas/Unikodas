/**
 * Lithuanian mobile phone validation and normalization.
 *
 * Lithuanian mobile numbers always start with the country code +370
 * followed by 8 digits, where the first digit after +370 is "6"
 * (mobile prefix). Total length: +370 + 8 digits = 12 chars,
 * e.g. +37061234567.
 *
 * Accepted input formats (we normalize them all to E.164 +370XXXXXXXX):
 *   - +370XXXXXXXX     (international, with +)
 *   - 370XXXXXXXX      (international, missing the +)
 *   - 86XXXXXXX        (national "8" prefix instead of country code)
 *   - With spaces, dashes, or parentheses anywhere
 *
 * Anything else — including the "00" international prefix, bare
 * subscriber numbers, landlines, foreign numbers, and malformed input
 * — is rejected.
 */

const LT_MOBILE_E164 = /^\+3706\d{7}$/;

/**
 * Try to normalize a user-entered phone number to canonical E.164 form
 * (+370XXXXXXXX). Returns null if the input is not a valid Lithuanian
 * mobile.
 */
export function normalizeLithuanianMobile(input: string): string | null {
  if (typeof input !== 'string') return null;

  // Detect a leading "+" before stripping. We then remove every
  // non-digit character (spaces, dashes, parens, additional "+" signs,
  // letters) so the prefix checks below see only digits.
  const trimmed = input.trim();
  const hadPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return null;

  let normalized: string;
  if (digits.startsWith('370')) {
    // Covers both "+370XXXXXXXX" (had +) and "370XXXXXXXX" (no +) —
    // the canonical form just needs the leading "+".
    normalized = '+' + digits;
  } else if (!hadPlus && digits.startsWith('86')) {
    // National format "8 6XX XXX XXX" — drop the leading 8, prepend
    // +370 so the result is +3706XXXXXXX.
    normalized = '+370' + digits.slice(1);
  } else {
    return null;
  }

  // Final E.164 mobile shape: +370, mobile prefix "6", then 7 digits.
  return LT_MOBILE_E164.test(normalized) ? normalized : null;
}

export function isValidLithuanianMobile(input: string): boolean {
  return normalizeLithuanianMobile(input) !== null;
}
