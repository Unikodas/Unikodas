import { z } from 'zod';

/**
 * Direct-message body validation. Mirrors the DB CHECK constraint
 * `char_length(body) between 1 and 2000` from migration 0001 — keep
 * the two in sync.
 */
export const MessageBodySchema = z
  .string()
  .trim()
  .min(1, 'body_required')
  .max(2000, 'body_too_long');
