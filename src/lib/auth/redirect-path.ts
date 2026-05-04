/**
 * Validate a candidate redirect path. Only same-origin absolute paths
 * are allowed (must start with "/" but not "//"); anything else returns
 * null.
 *
 * This blocks open-redirect attacks where an attacker could trick the
 * user into landing on a third-party host after login by crafting URLs
 * like `/prisijungti?redirect=//evil.example.com/path` or
 * `/prisijungti?redirect=https://evil.example.com`.
 *
 * Pure function — no I/O, no env access, no server-only imports — so
 * it can safely be imported from BOTH server modules (require-user.ts)
 * and Client Components (the sign-in page). Single source of truth for
 * post-login redirect validation.
 */
export function safeRedirectPath(raw: string | undefined | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  return raw;
}
