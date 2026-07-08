export type AutomotiveReferenceCategory =
  | 'BRAND'
  | 'MODEL'
  | 'SERIES'
  | 'PERFORMANCE'
  | 'SUPERCAR'
  | 'ENGINE'
  | 'NICKNAME';

export type AutomotiveReference = {
  keyword: string;
  displayName: string;
  category: AutomotiveReferenceCategory;
  aliases: readonly string[];
  confidence: number;
  collectorDescription: string;
  related?: readonly string[];
  brand?: string;
};

export type AutomotiveBrandKnowledge = {
  brandName: string;
  commonAbbreviations: readonly string[];
  popularModels: readonly string[];
  performanceModels: readonly string[];
  knownNicknames: readonly string[];
  commonEngineModelReferences: readonly string[];
  collectorNotes: string;
  references: readonly AutomotiveReference[];
};

export function defineBrandKnowledge<T extends AutomotiveBrandKnowledge>(knowledge: T): T {
  return knowledge;
}

export function reference(
  keyword: string,
  displayName: string,
  category: AutomotiveReferenceCategory,
  confidence: number,
  collectorDescription: string,
  aliases: readonly string[] = [],
  related: readonly string[] = [],
  brand?: string,
): AutomotiveReference {
  return {
    keyword,
    displayName,
    category,
    aliases,
    confidence,
    collectorDescription,
    related,
    brand,
  };
}

