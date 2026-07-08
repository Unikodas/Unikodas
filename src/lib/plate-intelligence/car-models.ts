// Legacy compatibility export. The launch knowledge base lives in
// src/lib/plate-intelligence/database; keep these constants for older rules.
import { AUDI_CODES as REFERENCE_AUDI_CODES } from '@/lib/plate-intelligence/references/audi';
import {
  BMW_ELECTRIC_MODELS,
  BMW_M_MODELS,
  BMW_MODEL_NUMBERS as REFERENCE_BMW_MODEL_NUMBERS,
  BMW_X_MODELS,
} from '@/lib/plate-intelligence/references/bmw';
import { FERRARI_CODES as REFERENCE_FERRARI_CODES } from '@/lib/plate-intelligence/references/ferrari';
import { LAMBORGHINI_CODES as REFERENCE_LAMBORGHINI_CODES } from '@/lib/plate-intelligence/references/lamborghini';
import {
  AMG_NUMBERS as REFERENCE_AMG_NUMBERS,
  MERCEDES_CLASSES,
  MERCEDES_MODEL_NUMBERS as REFERENCE_MERCEDES_MODEL_NUMBERS,
} from '@/lib/plate-intelligence/references/mercedes';
import { PORSCHE_CODES as REFERENCE_PORSCHE_CODES } from '@/lib/plate-intelligence/references/porsche';
import { VOLKSWAGEN_CODES as REFERENCE_VOLKSWAGEN_CODES } from '@/lib/plate-intelligence/references/volkswagen';
import { AUTOMOTIVE_REFERENCES, type AutomotiveReference } from '@/lib/plate-intelligence/references';

export const BMW_MODEL_NUMBERS = REFERENCE_BMW_MODEL_NUMBERS;
export const BMW_SERIES_CODES = [...BMW_M_MODELS, ...BMW_X_MODELS, ...BMW_ELECTRIC_MODELS] as const;
export const MERCEDES_MODEL_NUMBERS = REFERENCE_MERCEDES_MODEL_NUMBERS;
export { MERCEDES_CLASSES };
export const AMG_NUMBERS = REFERENCE_AMG_NUMBERS;
export const AUDI_CODES = REFERENCE_AUDI_CODES;
export const PORSCHE_CODES = REFERENCE_PORSCHE_CODES;
export const VOLKSWAGEN_CODES = REFERENCE_VOLKSWAGEN_CODES;
export const LAMBORGHINI_CODES = REFERENCE_LAMBORGHINI_CODES;
export const FERRARI_CODES = REFERENCE_FERRARI_CODES;

export const CAR_MODEL_TERMS = AUTOMOTIVE_REFERENCES.filter(isModelReference).map((reference) => ({
  text: reference.displayName,
  aliases: [reference.keyword, ...reference.aliases],
  brand: reference.brand ?? '',
  related: [...(reference.related ?? [])],
}));

function isModelReference(reference: AutomotiveReference): boolean {
  return reference.category === 'MODEL' || reference.category === 'SERIES' || reference.category === 'SUPERCAR';
}
