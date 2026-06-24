import { z } from 'zod';
import {
  LITHUANIAN_CITIES,
  type LithuanianCity,
} from '@/lib/locations/lithuania-cities';

/**
 * Stable English identifiers for plate types. Used as DB values, URL
 * filter values, and Zod enum members. UI labels are translated via
 * `lt.listings.types[<value>]`.
 *
 * Add new types here AND in lt.ts; widen the DB check constraint once
 * the set stabilises.
 */
export const PLATE_TYPES = [
  'standard',
  'personalized',
  'motorcycle',
  'historical',
  'other',
] as const;
export type PlateType = (typeof PLATE_TYPES)[number];

/**
 * Symbol printed on the plate. Different from PLATE_TYPES (which
 * describes the kind of plate). UI label is "Simbolis" — translated
 * via lt.listings.flagTypes[<value>].
 */
export const FLAG_TYPES = ['lithuanian_flag', 'eu_symbol', 'vytis'] as const;
export type FlagType = (typeof FLAG_TYPES)[number];

/** What we expect an already-parsed listing input to look like. */
export const ListingInputSchema = z.object({
  plate_text: z
    .string()
    .trim()
    .min(1, 'plate_required')
    .max(20, 'plate_too_long')
    .transform((s) => s.toUpperCase()),
  plate_type: z.enum(PLATE_TYPES, {
    errorMap: () => ({ message: 'plate_type_invalid' }),
  }),
  /** Symbol on the plate (Lithuanian flag / EU / Vytis). */
  flag_type: z.enum(FLAG_TYPES, {
    errorMap: () => ({ message: 'flag_type_invalid' }),
  }),
  /** Must be one of the canonical Lithuanian city names. */
  city: z.enum(LITHUANIAN_CITIES, {
    errorMap: () => ({ message: 'city_invalid' }),
  }),
  description: z.string().max(2000, 'description_too_long').nullable(),
  /** EUR, integer, 0..999_999. Required — no "kaina sutartinė" anymore. */
  price_eur: z
    .number({ errorMap: () => ({ message: 'price_required' }) })
    .int()
    .min(0, 'price_invalid')
    .max(999_999, 'price_too_high'),
});

export type ListingInput = z.infer<typeof ListingInputSchema>;

/**
 * Parse a Server Action FormData payload into a validated ListingInput.
 * Throws ZodError on validation failure; the caller maps issues to
 * i18n error codes.
 */
export function parseListingFormData(formData: FormData): ListingInput {
  const plateText = String(formData.get('plate_text') ?? '').trim();
  const plateType = String(formData.get('plate_type') ?? '').trim();
  const flagType = String(formData.get('flag_type') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();

  const descriptionRaw = String(formData.get('description') ?? '').trim();
  const description = descriptionRaw.length === 0 ? null : descriptionRaw;

  // Price is required — no "kaina sutartinė" / empty allowed.
  const priceRaw = String(formData.get('price_eur') ?? '').trim();
  if (priceRaw.length === 0) {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['price_eur'],
        message: 'price_required',
      },
    ]);
  }
  const n = Number(priceRaw);
  if (!Number.isFinite(n) || n < 0) {
    throw new z.ZodError([
      {
        code: 'custom',
        path: ['price_eur'],
        message: 'price_invalid',
      },
    ]);
  }
  const price = Math.trunc(n);

  return ListingInputSchema.parse({
    plate_text: plateText,
    plate_type: plateType,
    flag_type: flagType,
    city,
    description,
    price_eur: price,
  });
}

/**
 * Filter input pulled from the browse page's URL search params.
 * Anything missing or malformed is treated as "no filter".
 */
export type ListingFilters = {
  q: string | null;
  plate_type: PlateType | null;
  flag_type: FlagType | null;
  city: LithuanianCity | null;
  minPrice: number | null;
  maxPrice: number | null;
};

export function parseListingFilters(
  searchParams: Record<string, string | string[] | undefined>,
): ListingFilters {
  const pickString = (key: string): string | null => {
    const v = searchParams[key];
    if (typeof v !== 'string') return null;
    const trimmed = v.trim();
    return trimmed.length === 0 ? null : trimmed;
  };
  const pickInt = (key: string): number | null => {
    const s = pickString(key);
    if (s === null) return null;
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
  };
  const pickPlateType = (): PlateType | null => {
    const s = pickString('type');
    if (s === null) return null;
    return (PLATE_TYPES as readonly string[]).includes(s) ? (s as PlateType) : null;
  };
  const pickFlagType = (): FlagType | null => {
    const s = pickString('flag');
    if (s === null) return null;
    return (FLAG_TYPES as readonly string[]).includes(s) ? (s as FlagType) : null;
  };
  const pickCity = (): LithuanianCity | null => {
    const s = pickString('city');
    if (s === null) return null;
    return (LITHUANIAN_CITIES as readonly string[]).includes(s)
      ? (s as LithuanianCity)
      : null;
  };

  return {
    q: pickString('q'),
    plate_type: pickPlateType(),
    flag_type: pickFlagType(),
    city: pickCity(),
    minPrice: pickInt('min'),
    maxPrice: pickInt('max'),
  };
}
