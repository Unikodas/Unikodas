# Roadmap — Lithuanian Number Plate Marketplace MVP

Build order. Each step is shippable on its own.

## Step 1 — Foundation  ✅
- Next.js 15 + TS + Tailwind scaffold
- Supabase clients (browser, server, middleware) using `@supabase/ssr`
- Database schema with RLS: `profiles`, `listings`, `wanted_listings`, `messages`, `otp_codes`, `rate_limits`
- Lithuanian phone validator (`+370` mobile)
- Central Lithuanian UI strings file (`lib/i18n/lt.ts`)
- Env template, `.gitignore`, README

## Step 2 — Authentication (stub OTP for dev)  ✅
- `/prisijungti` two-step phone+code form
- `POST /api/auth/otp/request` — generates 6-digit code, HMAC-hashes + stores, hands to SMS provider (stub prints to console)
- `POST /api/auth/otp/verify` — atomic verify in Postgres function, mints Supabase session via admin generateLink + verifyOtp
- `POST /api/auth/signout`
- `/profilis` shows current user's phone (smoke test, RLS-gated)
- Phone uniqueness enforced at DB (auth.users + profiles unique constraints + trigger)
- Rate limits: 3 req/phone/h, 5 req/IP/h, 10 verify/phone/15m, 20 verify/IP/15m, 5 attempts/code
- Provider seam (`lib/sms/`) ready for Twilio/Vonage swap

## Step 3 — Listings  ✅
- Public browse page `/` with card grid (no login required)
- URL-driven filters: plate text (`q`), plate type, city, min/max price
- Listing detail page `/skelbimas/[id]` (public; contact section disabled per spec)
- Authenticated create at `/parduoti` (`requireUser` → form → Server Action insert)
- Owner-only edit at `/skelbimas/[id]/redaguoti` (page redirect + Server Action ownership check + RLS)
- Owner-only delete via Client button + Server Action
- Zod schema in `lib/validation/listing.ts` (`plate_text`, `plate_type`, `city`, `description`, `price_eur`)
- Plate types: `standard, personalized, historical, other` (UI labels in `lt.listings.types`)
- Image upload UI deferred (DB column exists; wire when we add Supabase Storage)

## Step 4 — Wanted listings  ✅
- Public browse at `/ieskau` (no login)
- Detail at `/ieskau/[id]` (contact disabled per spec)
- Auth-required create at `/ieskau/naujas` (`requireUser` → form → Server Action insert)
- Owner-only edit at `/ieskau/[id]/redaguoti` (page redirect + Server Action ownership check + RLS)
- Owner-only delete via Client button + Server Action
- Zod schema in `lib/validation/wanted.ts` (`plate_pattern`, `description`, `max_price_eur`)
- Filter: free-text `q` matched across `plate_pattern` + `description`
- Header on `/` extended with "Ieškomi" nav link

## Step 5 — Messaging / contact seller  🟡 (partial)
- Compose form on `/skelbimas/[id]` (signed-in non-owners only)
- `sendMessageAction` validates body, rate-limits 20/hour/user, reads recipient from listing server-side, redirects to `/zinutes`
- Basic inbox at `/zinutes`: chronological list of sent + received messages, counterparty name via `public_profiles` view
- "Žinutės" nav link in headers when signed in
- Migration 0003: pg_trgm + GIN indexes on wanted_listings.plate_pattern and description (Step 4 follow-up)

Deliberately deferred to a later step:
- Real-time updates (websockets / polling)
- Thread / conversation grouping view
- Read / unread tracking
- Messaging on wanted listings (would need `wanted_listing_id` column on messages)

## Step 6 — Hardening & moderation  ✅
- Migration 0004: `profiles.is_admin` flag, `reports` table (with RLS), `admin_actions` audit log
- `requireAdmin()` helper — 404s non-admins to keep /admin/* opaque
- Reports: Zod schema, `createReportAction` (rate-limited 10/h/user, unique per (reporter, target)), `ReportButton` component on listing/wanted detail + inbox (received messages only)
- Admin queue at `/admin`: pending reports with target preview, three actions per row (dismiss / resolve / remove). Remove sets `status='removed'` for listing/wanted, deletes the row for messages. Every action writes to `admin_actions`.
- CAPTCHA seam: `lib/captcha/{provider,stub}.ts` mirroring the SMS pattern. Wired into `/api/auth/otp/request`. Stub accepts any token when `CAPTCHA_DEV_MODE=true`. Integration plan in README; widget mount point already in the sign-in page.

Deferred (next iteration):
- Real CAPTCHA provider wired up (Turnstile / hCaptcha)
- Real SMS provider (still using the stub from Step 2)
- IP-based rate limiting on more endpoints
- User banning / cooldowns based on moderation outcomes
- Logging / observability beyond `console.error`

## Out of scope for MVP
- Payments / escrow
- Ratings / reviews
- Public user profiles beyond display name + verified phone badge
- Advanced search (full-text, fuzzy)

These can come post-launch once we see real usage.
