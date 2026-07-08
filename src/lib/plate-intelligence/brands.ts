// Legacy compatibility export. The launch knowledge base lives in
// src/lib/plate-intelligence/database; keep this shape for older imports.
import { AUTOMOTIVE_BRANDS } from '@/lib/plate-intelligence/references';

const normalizeKeyword = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

export const CAR_BRANDS = AUTOMOTIVE_BRANDS.map((brand) => {
  const text = normalizeKeyword(brand.brandName === 'Mercedes-Benz' ? 'Mercedes' : brand.brandName);
  const aliases = [...brand.commonAbbreviations, ...brand.knownNicknames]
    .map(normalizeKeyword)
    .filter((alias, index, values) => alias && alias !== text && values.indexOf(alias) === index);

  return {
    text,
    aliases,
    related: brand.references.slice(0, 8).map((reference) => reference.keyword),
  };
});
