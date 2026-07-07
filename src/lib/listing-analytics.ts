import 'server-only';

import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export const LISTING_EVENT_TYPES = [
  'view',
  'favorite',
  'unfavorite',
  'contact',
  'message',
  'price_change',
  'marked_sold',
  'removed',
  'shared',
] as const;

export type ListingEventType = (typeof LISTING_EVENT_TYPES)[number];

export const LISTING_COUNTERS = [
  'view_count',
  'contact_count',
  'favorite_count',
  'share_count',
] as const;

export type ListingCounterName = (typeof LISTING_COUNTERS)[number];

type AnalyticsMetadata = Record<string, unknown>;

function isListingEventType(value: string): value is ListingEventType {
  return (LISTING_EVENT_TYPES as readonly string[]).includes(value);
}

function isListingCounter(value: string): value is ListingCounterName {
  return (LISTING_COUNTERS as readonly string[]).includes(value);
}

function sanitizeMetadata(metadata?: AnalyticsMetadata): AnalyticsMetadata {
  if (!metadata) return {};
  return JSON.parse(JSON.stringify(metadata)) as AnalyticsMetadata;
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch (err) {
    console.error('[listing-analytics] user lookup failed:', err);
    return null;
  }
}

export async function recordListingEvent(
  listingId: string,
  eventType: ListingEventType,
  metadata?: AnalyticsMetadata,
): Promise<void> {
  if (!isListingEventType(eventType)) {
    console.error('[listing-analytics] invalid event type:', eventType);
    return;
  }

  try {
    const [userId, admin] = await Promise.all([
      getCurrentUserId(),
      Promise.resolve(createServiceRoleClient()),
    ]);

    const { error } = await admin.from('listing_events').insert({
      listing_id: listingId,
      user_id: userId,
      event_type: eventType,
      metadata: sanitizeMetadata(metadata),
    });

    if (error) {
      console.error('[listing-analytics] event insert failed:', error);
    }
  } catch (err) {
    console.error('[listing-analytics] event write failed:', err);
  }
}

export async function incrementListingCounter(
  listingId: string,
  counterName: ListingCounterName,
): Promise<void> {
  if (!isListingCounter(counterName)) {
    console.error('[listing-analytics] invalid counter:', counterName);
    return;
  }

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin.rpc('increment_listing_counter', {
      p_listing_id: listingId,
      p_counter_name: counterName,
    });

    if (error) {
      console.error('[listing-analytics] counter increment failed:', error);
    }
  } catch (err) {
    console.error('[listing-analytics] counter write failed:', err);
  }
}

export async function recordPriceChange(
  listingId: string,
  oldPrice: number | null,
  newPrice: number,
  changedBy?: string | null,
): Promise<void> {
  try {
    const admin = createServiceRoleClient();

    const { error: historyError } = await admin.from('listing_price_history').insert({
      listing_id: listingId,
      old_price: oldPrice,
      new_price: newPrice,
      changed_by: changedBy ?? null,
    });

    if (historyError) {
      console.error('[listing-analytics] price history insert failed:', historyError);
    }

    const { error: eventError } = await admin.from('listing_events').insert({
      listing_id: listingId,
      user_id: changedBy ?? null,
      event_type: 'price_change',
      metadata: {
        old_price: oldPrice,
        new_price: newPrice,
      },
    });

    if (eventError) {
      console.error('[listing-analytics] price change event insert failed:', eventError);
    }
  } catch (err) {
    console.error('[listing-analytics] price change write failed:', err);
  }
}
