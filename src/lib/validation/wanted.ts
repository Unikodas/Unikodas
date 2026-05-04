import { z } from 'zod';

/**
 * Validation for "wanted" listings (buyers describing what they're looking for).
 *
 * Rule: at least ONE of plate_pattern or description must be non-empty.
 * Both fields are individually optional/permissive so users can post
 * a free-text "I want any vintage plate from the 60s" without filling
 * a structured pattern, OR a tight pattern like "ABC ???" without
 * a description.
 */

const baseWanted = z.object({
  plate_pattern: z.string().trim().max(50, 'pattern_too_long'),
  description: z.string().max(2000, 'description_too_long').nullable(),
  /** EUR, integer, 0..999_999. Null means "biudžetas neapibrėžtas". */
  max_price_eur: z
    .number()
    .int()
    .min(0, 'price_invalid')
    .max(999_999, 'price_too_high')
    .nullable(),
});

export const WantedInputSchema = baseWanted.refine(
  (data) => {
    const patternLen = data.plate_pattern.length;
    const descLen = data.description !== null ? data.description.trim().length : 0;
    return patternLen > 0 || descLen > 0;
  },
  {
    message: 'pattern_or_description_required',
    path: ['plate_pattern'],
  },
);

export type WantedInput = z.infer<typeof WantedInputSchema>;

/**
 * Lightweight spam heuristic for the description field. Intentionally
 * conservative — we want to block obvious garbage ("aaaaa", "....", "x"),
 * not police writing style. Real abuse-reporting comes in a later step.
 *
 * Returns true if the text looks like spam.
 */
export function isLikelySpamDescription(desc: string | null): boolean {
  if (desc === null) return false;
  const stripped = desc.replace(/\s/g, '');
  if (stripped.length < 5) return true;
  // All one character (case-insensitive): "AaAa", "....", "11111".
  const unique = new Set(stripped.toLowerCase());
  if (unique.size === 1) return true;
  return false;
}

/**
 * Parse a Server Action FormData payload into a validated WantedInput.
 * Throws ZodError on validation failure; the caller maps issues to
 * i18n error codes.
 */
export function parseWantedFormData(formData: FormData): WantedInput {
  const platePattern = String(formData.get('plate_pattern') ?? '').trim();

  const descriptionRaw = String(formData.get('description') ?? '').trim();
  const description = descriptionRaw.length === 0 ? null : descriptionRaw;

  const priceRaw = String(formData.get('max_price_eur') ?? '').trim();
  let price: number | null = null;
  if (priceRaw.length > 0) {
    const n = Number(priceRaw);
    if (!Number.isFinite(n) || n < 0) {
      throw new z.ZodError([
        {
          code: 'custom',
          path: ['max_price_eur'],
          message: 'price_invalid',
        },
      ]);
    }
    price = Math.trunc(n);
  }

  return WantedInputSchema.parse({
    plate_pattern: platePattern,
    description,
    max_price_eur: price,
  });
}

// ---------- filters ----------------------------------------------------

export const WANTED_SORT_OPTIONS = ['newest', 'cheapest'] as const;
export type WantedSortOption = (typeof WANTED_SORT_OPTIONS)[number];

export type WantedListingsFilters = {
  q: string | null;
  sort: WantedSortOption;
};

export function parseWantedFilters(
  searchParams: Record<string, string | string[] | undefined>,
): WantedListingsFilters {
  const v = searchParams.q;
  const q = typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

  const sortRaw =
    typeof searchParams.sort === 'string' ? searchParams.sort.trim() : '';
  const sort: WantedSortOption = (WANTED_SORT_OPTIONS as readonly string[]).includes(
    sortRaw,
  )
    ? (sortRaw as WantedSortOption)
    : 'newest';

  return { q, sort };
}
