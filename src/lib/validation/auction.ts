import { z } from 'zod';
import { FLAG_TYPES, PLATE_TYPES } from './listing';
import { LITHUANIAN_CITIES } from '@/lib/locations/lithuania-cities';

export const AuctionInputSchema = z.object({
  plate_text: z.string().trim().min(1).max(20).transform((value) => value.toUpperCase()),
  plate_type: z.enum(PLATE_TYPES),
  flag_type: z.enum(FLAG_TYPES),
  city: z.enum(LITHUANIAN_CITIES),
  description: z.string().max(2000).nullable(),
  start_price_eur: z.number().int().min(1).max(999_999),
  reserve_price_eur: z.number().int().min(1).max(999_999).nullable(),
  duration_days: z.number().int().min(3).max(7),
}).refine(
  (value) => value.reserve_price_eur === null || value.reserve_price_eur >= value.start_price_eur,
  { message: 'reserve_too_low', path: ['reserve_price_eur'] },
);

export function parseAuctionFormData(formData: FormData) {
  const number = (name: string, nullable = false) => {
    const raw = String(formData.get(name) ?? '').trim();
    if (!raw && nullable) return null;
    return Number(raw);
  };
  const description = String(formData.get('description') ?? '').trim();
  return AuctionInputSchema.parse({
    plate_text: String(formData.get('plate_text') ?? ''),
    plate_type: String(formData.get('plate_type') ?? ''),
    flag_type: String(formData.get('flag_type') ?? ''),
    city: String(formData.get('city') ?? ''),
    description: description || null,
    start_price_eur: number('start_price_eur'),
    reserve_price_eur: number('reserve_price_eur', true),
    duration_days: number('duration_days'),
  });
}

export function minimumBid(currentPrice: number) {
  if (currentPrice < 100) return currentPrice + 5;
  if (currentPrice < 500) return currentPrice + 10;
  if (currentPrice < 2000) return currentPrice + 25;
  if (currentPrice < 5000) return currentPrice + 50;
  return currentPrice + 100;
}

