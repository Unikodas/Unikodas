# Numerių rinka — Lithuanian Number Plate Marketplace

MVP for buying and selling unique Lithuanian vehicle number plates.

## Tech stack
- **Next.js 15** (App Router, TypeScript, Server Actions)
- **Tailwind CSS** for styling
- **Supabase** (Postgres + Auth + RLS) for backend and database
- **Vercel** for hosting (planned)

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Supabase project at https://supabase.com and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (server-only — never expose this in the browser)

3. Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

4. Run the database migrations. In the Supabase dashboard, open **SQL Editor** and run, in order:
   - `supabase/migrations/0001_initial_schema.sql` — tables, RLS, `public_profiles` view
   - `supabase/migrations/0002_auth.sql` — profile-creation trigger, OTP & rate-limit functions

5. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Auth flow (dev)

This MVP runs its own OTP layer (no real SMS provider yet):

1. Open `/prisijungti`, enter a Lithuanian mobile (`+370 6XX XXX XXX`).
2. The 6-digit code prints to the **server console** — copy it from your `npm run dev` terminal.
3. Enter the code. On success you're redirected to `/profilis`.

Rate limits in effect: 3 OTP requests / phone / hour, 5 / IP / hour, 10 verify attempts / phone / 15 min, max 5 attempts per code. Codes expire after 5 minutes.

To switch to a real SMS provider later, implement `SmsProvider` in `src/lib/sms/`, register it in `getSmsProvider()`, and set `SMS_PROVIDER` in your environment.

## Moderation

A user with `profiles.is_admin = true` can access `/admin` (the reports queue). To grant admin to yourself in dev:

```sql
update public.profiles set is_admin = true where phone = '+370XXXXXXXX';
```

Non-admins get a 404 on `/admin/*` so the route's existence isn't disclosed. Admin actions (dismiss / resolve / remove) write an audit row to `admin_actions`.

Reports can target listings, wanted ads, or individual messages. Each (reporter, target) pair is unique at the DB level — one report per item per user.

## CAPTCHA integration plan

The OTP request endpoint already calls `getCaptchaProvider().verifyToken(token, ip)`. Today the dev stub accepts any token (gated on `CAPTCHA_DEV_MODE=true`). Wiring a real provider:

1. Pick a provider — Cloudflare Turnstile (recommended) or hCaptcha.
2. Add `CAPTCHA_TURNSTILE_SITE_KEY` (public, can be `NEXT_PUBLIC_*`) and `CAPTCHA_TURNSTILE_SECRET_KEY` (server-only) to `.env`.
3. Implement `src/lib/captcha/turnstile.ts` exporting a `CaptchaProvider` whose `verifyToken` does the HTTPS POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`.
4. Register it in `src/lib/captcha/provider.ts` (`case 'turnstile'`).
5. Set `CAPTCHA_PROVIDER=turnstile` and `CAPTCHA_DEV_MODE=false` in production.
6. Add the widget script + `<div class="cf-turnstile" data-sitekey="…">` to the sign-in page where the existing `#captcha-mount` div is. Read the token from the widget callback and send it in the OTP request body as `captcha_token`.

The seam is in place — only step 3 is real new code; everything else is config.

## Project structure

```
src/
├── app/                  # Next.js routes (App Router)
├── lib/
│   ├── supabase/         # Supabase clients (browser, server, middleware)
│   ├── validation/       # Input validators (phone, etc.)
│   └── i18n/             # Lithuanian UI strings
└── middleware.ts         # Session refresh on every request
supabase/
└── migrations/           # SQL schema migrations (run manually in dashboard for MVP)
```

## Security principles
- No secrets in client-side code; service role key is server-only.
- All write paths validated server-side (Zod schemas + RLS).
- Phone format strictly `+370` (Lithuanian mobiles only).
- Rate limiting on OTP, listing creation, and messaging.
- One phone number per account (DB unique constraint).

## Roadmap
See `ROADMAP.md`.
