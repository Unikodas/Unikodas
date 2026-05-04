import { type NextRequest } from 'next/server';

/**
 * Extract the client IP from a Next request.
 *
 * Trust order:
 *   1. `x-forwarded-for` first hop (Vercel sets this; on other hosts it's
 *      whatever the load balancer puts there).
 *   2. `x-real-ip` (some reverse proxies).
 *   3. Fallback to "0.0.0.0" so we still produce a stable rate-limit key
 *      rather than throwing — if an attacker can suppress all client-IP
 *      headers, all such requests share the same bucket and get throttled
 *      together, which is the safe default.
 *
 * Hosting note: when we deploy somewhere other than Vercel, double-check
 * the platform sets one of these headers and that we're not behind an
 * untrusted proxy that would let a client spoof them.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get('x-real-ip');
  if (xri) return xri.trim();
  return '0.0.0.0';
}
