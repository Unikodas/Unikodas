import { analyzePlate } from '@/lib/plate-intelligence';
import type { FlagType, PlateType } from '@/lib/validation/listing';

export type InterestingPlateListing = {
  id: string;
  plate_text: string;
  plate_type: PlateType;
  flag_type: FlagType;
};

export type InterestingPlateInsight = {
  score: number;
  label: string | null;
  reason: string;
  badges: string[];
};

export type WithInterestingPlateInsight<T> = T & {
  insight: InterestingPlateInsight;
};

export const INTERESTING_LISTING_CANDIDATE_LIMIT = 100;

export function getPlateInsight(listing: InterestingPlateListing): InterestingPlateInsight {
  const analysis = analyzePlate(listing.plate_text, {
    symbol: listing.flag_type,
    type: listing.plate_type,
  });
  const topMeaning = analysis.topMeanings[0];
  const reason =
    analysis.collectorInsights[0] ??
    topMeaning?.reason ??
    'Derinys gali turėti asmeninę reikšmę konkrečiam pirkėjui.';

  return {
    score: analysis.score,
    label: getInterestingBadgeLabel(analysis.score),
    reason,
    badges: [
      ...(topMeaning ? [topMeaning.text] : []),
      ...analysis.badges,
    ].slice(0, 4),
  };
}

export function getInterestingBadgeLabel(score: number): string | null {
  if (score >= 85) return 'Kolekcinis';
  if (score >= 70) return 'Įdomus';
  if (score >= 55) return 'Patrauklus';
  return null;
}

export function rankInterestingListings<T extends InterestingPlateListing>(
  listings: T[],
  limit: number,
): Array<WithInterestingPlateInsight<T>> {
  return listings
    .map((listing) => ({
      ...listing,
      insight: getPlateInsight(listing),
    }))
    .filter((listing) => listing.insight.score >= 55)
    .sort((a, b) => b.insight.score - a.insight.score || b.plate_text.localeCompare(a.plate_text))
    .slice(0, limit);
}
