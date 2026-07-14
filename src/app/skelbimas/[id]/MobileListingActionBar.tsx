'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type MobileListingActionBarProps = {
  href: string;
  label: string;
  price: string;
  meta: string;
};

export function MobileListingActionBar({
  href,
  label,
  price,
  meta,
}: MobileListingActionBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const primaryAction = document.querySelector('[data-mobile-primary-action="true"]');

    if (primaryAction && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setVisible(!entry.isIntersecting);
        },
        { rootMargin: '-96px 0px 0px 0px', threshold: 0.2 },
      );

      observer.observe(primaryAction);

      return () => {
        observer.disconnect();
      };
    }

    const updateVisibility = () => {
      setVisible(window.scrollY > 360);
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateVisibility);
    };
  }, []);

  return (
    <div
      className={[
        'fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 px-4 transition duration-200 sm:hidden',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      ].join(' ')}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color:color-mix(in_srgb,var(--card)_88%,transparent)] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.36)] backdrop-blur-xl">
        <div className="min-w-0 flex-1 px-2">
          <p className="truncate text-lg font-black leading-tight text-[var(--primary)]">
            {price}
          </p>
          <p className="truncate text-xs font-bold text-[var(--muted-foreground)]">
            {meta}
          </p>
        </div>
        <Link href={href} className="app-button-primary min-h-11 shrink-0 px-4 py-2 text-sm">
          {label}
        </Link>
      </div>
    </div>
  );
}
