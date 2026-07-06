'use client';

import { useState } from 'react';

type ShareButtonProps = {
  title: string;
  text?: string;
  className?: string;
};

export function ShareButton({ title, text, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, text, url });
          } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          }
        } catch {
          // User cancelled the native share sheet; no UI error needed.
        }
      }}
    >
      {copied ? 'Nuoroda nukopijuota' : 'Dalintis'}
    </button>
  );
}
