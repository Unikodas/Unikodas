// Legacy automotive reference pack kept for compatibility exports in
// brands.ts, car-models.ts, and performance.ts. New inference data should be
// added through src/lib/plate-intelligence/database instead.
import { AUTOMOTIVE_BRANDS } from './brands';
import { ENGINE_REFERENCES } from './engines';
import { PERFORMANCE_REFERENCES } from './performance';

export type { AutomotiveBrandKnowledge, AutomotiveReference, AutomotiveReferenceCategory } from './types';

export { AUTOMOTIVE_BRANDS } from './brands';

export const AUTOMOTIVE_REFERENCES = [
  ...AUTOMOTIVE_BRANDS.flatMap((brand) => brand.references),
  ...PERFORMANCE_REFERENCES,
  ...ENGINE_REFERENCES,
] as const;

export const AUTOMOTIVE_REFERENCE_COUNT = AUTOMOTIVE_REFERENCES.length;
