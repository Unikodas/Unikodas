'use client';

import { useEffect } from 'react';

export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/listings/${encodeURIComponent(listingId)}/view`, {
      method: 'POST',
      signal: controller.signal,
    }).catch(() => {
      // Analytics must never affect the listing detail experience.
    });

    return () => controller.abort();
  }, [listingId]);

  return null;
}
