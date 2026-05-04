/**
 * Canonical list of Lithuanian cities used for listing locations.
 *
 * Order: rough population descending, with a few smaller resort towns
 * inserted alphabetically. "Kita" (Other) is intentionally last as a
 * fallback for sellers from towns not on the main list — it keeps the
 * dropdown short while still letting smaller-town users post.
 *
 * Add to this list as needed; the DB column is plain text so widening
 * the set doesn't require a migration.
 *
 * Used by:
 *   - lib/validation/listing.ts (Zod enum)
 *   - components/ListingForm.tsx (create/edit dropdown)
 *   - components/ListingFilters.tsx (browse dropdown)
 */
export const LITHUANIAN_CITIES = [
  'Vilnius',
  'Kaunas',
  'Klaipėda',
  'Šiauliai',
  'Panevėžys',
  'Alytus',
  'Marijampolė',
  'Mažeikiai',
  'Jonava',
  'Utena',
  'Kėdainiai',
  'Telšiai',
  'Tauragė',
  'Visaginas',
  'Ukmergė',
  'Plungė',
  'Kretinga',
  'Šilutė',
  'Palanga',
  'Radviliškis',
  'Druskininkai',
  'Rokiškis',
  'Elektrėnai',
  'Biržai',
  'Anykščiai',
  'Vilkaviškis',
  'Lentvaris',
  'Garliava',
  'Grigiškės',
  'Naujoji Akmenė',
  'Prienai',
  'Joniškis',
  'Kelmė',
  'Varėna',
  'Kupiškis',
  'Zarasai',
  'Šalčininkai',
  'Trakai',
  'Molėtai',
  'Skuodas',
  'Kita',
] as const;

export type LithuanianCity = (typeof LITHUANIAN_CITIES)[number];
