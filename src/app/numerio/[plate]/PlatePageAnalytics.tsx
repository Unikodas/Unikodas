'use client';

import { useEffect } from 'react';

type PlatePageEventType = 'page_view' | 'analysis_open' | 'sell_click' | 'telegram_click';

type PlatePageAnalyticsProps = {
  plate: string;
  score: number;
};

type GtagWindow = Window & {
  gtag?: (
    command: 'event',
    eventName: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) => void;
};

export function PlatePageAnalytics({ plate, score }: PlatePageAnalyticsProps) {
  useEffect(() => {
    const sendEvent = (eventType: PlatePageEventType) => {
      (window as GtagWindow).gtag?.('event', `plate_${eventType}`, {
        plate,
        score,
      });

      const body = JSON.stringify({
        plate,
        score,
        eventType,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/plate-page-event', new Blob([body], { type: 'application/json' }));
        return;
      }

      fetch('/api/plate-page-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {
        // Analytics should never block navigation.
      });
    };

    sendEvent('page_view');

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLElement>('[data-plate-event]');
      const eventType = link?.dataset.plateEvent as PlatePageEventType | undefined;
      if (!eventType) return;
      sendEvent(eventType);
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [plate, score]);

  return null;
}
