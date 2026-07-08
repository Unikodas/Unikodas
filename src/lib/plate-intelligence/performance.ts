// Legacy compatibility export. The launch knowledge base lives in
// src/lib/plate-intelligence/database; keep this list for older imports.
import { AUTOMOTIVE_REFERENCES } from '@/lib/plate-intelligence/references';

export const PERFORMANCE_TERMS = Array.from(
  new Set(
    AUTOMOTIVE_REFERENCES.filter((reference) =>
      ['ENGINE', 'NICKNAME', 'PERFORMANCE'].includes(reference.category),
    ).map((reference) => reference.keyword),
  ),
);
