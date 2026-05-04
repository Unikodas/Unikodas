import { z } from 'zod';

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/**
 * Password input validation.
 *
 * Length-only rules — no mandatory complexity (NIST 800-63B). Length
 * beats complexity for entropy and complexity rules push users toward
 * predictable patterns.
 *
 * No trim: leading / trailing whitespace are valid characters and
 * silently stripping them would surprise a user whose password is
 * exactly that. The form should not collapse whitespace.
 */
export const PasswordSchema = z
  .string()
  .min(PASSWORD_MIN, 'password_too_short')
  .max(PASSWORD_MAX, 'password_too_long');
