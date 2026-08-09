'use client';

import { useCallback } from 'react';

export type CommunityCTAPlacement = 'hero' | 'listing' | 'empty_search' | 'footer';

type CommunityCTAProps = {
  placement: CommunityCTAPlacement;
  listingId?: string;
  className?: string;
  variant?: 'standalone' | 'embedded';
};

const TELEGRAM_URL = 'https://t.me/+xweru-k3heRlMjY0';

type GtagWindow = Window & {
  gtag?: (
    command: 'event',
    eventName: string,
    params?: Record<string, string | number | boolean | undefined>,
  ) => void;
};

export function CommunityCTA({
  placement,
  listingId,
  className = '',
  variant = 'standalone',
}: CommunityCTAProps) {
  const trackClick = useCallback(() => {
    const payload = {
      placement,
      listingId,
      destination: 'telegram',
    };

    (window as GtagWindow).gtag?.('event', 'community_click', payload);

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/community-click', new Blob([body], { type: 'application/json' }));
      return;
    }

    fetch('/api/community-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Community tracking must never block navigation to Telegram.
    });
  }, [listingId, placement]);

  return (
    <section
      className={[
        variant === 'standalone'
          ? 'app-card-soft overflow-hidden p-4 sm:p-5'
          : 'border-t border-[var(--border)] pt-4 sm:pt-5',
        placement === 'footer' ? 'mx-auto max-w-3xl text-left' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby={`community-cta-${placement}`}
    >
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <p
            id={`community-cta-${placement}`}
            className={[
              'font-bold leading-tight text-[var(--foreground)]',
              variant === 'embedded' ? 'text-lg sm:text-xl' : 'text-xl',
            ].join(' ')}
          >
            Prisijunkite prie Unikodas bendruomenės
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
            Lietuviška bendruomenė automobilių numerių entuziastams.
          </p>
        </div>

        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackClick}
          className="app-button-primary min-h-[52px] px-5 py-3 text-center text-sm"
        >
          Prisijungti per Telegram
        </a>
      </div>

      {variant === 'standalone' && (
        <p className="mt-3 border-t border-[var(--border)] pt-3 text-xs text-[var(--muted-soft)]">
          Nauji skelbimai, ieškomi numeriai ir bendruomenės diskusijos.
        </p>
      )}
    </section>
  );
}
