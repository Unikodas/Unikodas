'use client';

import { useEffect, useState } from 'react';

function remainingLabel(target: string, now: number) {
  const difference = new Date(target).getTime() - now;
  if (difference <= 0) return 'Aukcionas baigėsi';
  const seconds = Math.floor(difference / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days} d. ${hours} val.`;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function AuctionCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return <span suppressHydrationWarning>{remainingLabel(endsAt, now)}</span>;
}

