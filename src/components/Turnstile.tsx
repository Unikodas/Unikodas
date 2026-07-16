'use client';

import { useEffect, useRef } from 'react';

/**
 * Minimal Cloudflare Turnstile widget for invisible/managed challenges.
 *
 * Usage:
 *   const [token, setToken] = useState<string | null>(null);
 *   <Turnstile onToken={setToken} />
 *   // submit only if token is non-null
 *
 * Behavior:
 *   - Loads the Turnstile script once per page (idempotent across mounts).
 *   - Renders the widget into an internal <div> via window.turnstile.render.
 *   - Calls onToken(token) when the user completes the challenge.
 *   - Calls onToken(null) when the token expires or errors out, so the
 *     parent re-blocks form submit until the user solves it again.
 *   - Cleans up the widget on unmount.
 *
 * Env: reads NEXT_PUBLIC_TURNSTILE_SITE_KEY at render time. If missing,
 * the widget silently doesn't render and onToken is never called —
 * forms gated on the token will refuse to submit, which is the safe
 * default. A console warning surfaces the misconfiguration in dev.
 */

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileApi = {
  render: (element: HTMLElement, options: TurnstileOptions) => string;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

type TurnstileOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
};

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface TurnstileProps {
  onToken: (token: string | null) => void;
}

export function Turnstile({ onToken }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // Hold the latest onToken in a ref so the effect doesn't re-run when
  // the parent re-creates its callback.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      // Local development uses the server-side CAPTCHA stub. Supplying a
      // non-empty development token keeps the sign-in flow usable without
      // weakening production, where NODE_ENV is "production" and a real
      // Turnstile key remains mandatory.
      if (process.env.NODE_ENV === 'development') {
        onTokenRef.current('local-development-captcha');
        return;
      }
      // eslint-disable-next-line no-console
      console.warn(
        '[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set; widget will not render.',
      );
      return;
    }

    let cancelled = false;

    function renderWidget() {
      if (cancelled) return;
      if (!containerRef.current) return;
      if (!window.turnstile) return;
      if (widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey!,
          callback: (token) => onTokenRef.current(token),
          'expired-callback': () => onTokenRef.current(null),
          'error-callback': () => onTokenRef.current(null),
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[Turnstile] render failed:', err);
      }
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        `script[src="${SCRIPT_URL}"]`,
      );
      if (!script) {
        script = document.createElement('script');
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderWidget);
    }

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* widget already disposed */
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} className="my-2" />;
}
