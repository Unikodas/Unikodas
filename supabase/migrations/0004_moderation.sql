-- =====================================================================
-- 0004_moderation.sql
-- Moderation tools: admin flag, reports table, admin-actions audit log.
-- Apply via Supabase SQL Editor after 0003.
--
-- HOW TO MAKE A USER AN ADMIN:
--   update public.profiles set is_admin = true where phone = '+370...';
-- =====================================================================

-- ---------- admin flag -----------------------------------------------

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- ---------- reports table --------------------------------------------
-- Users can report listings, wanted ads, or individual messages.
-- One report per (reporter, target) — the unique constraint stops a
-- single user from spam-clicking "report" on the same item.

create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_type   text not null check (target_type in ('listing','wanted','message')),
  target_id     uuid not null,
  reason        text not null check (reason in ('spam','scam','inappropriate','other')),
  details       text check (details is null or char_length(details) <= 1000),
  status        text not null default 'pending'
                  check (status in ('pending','resolved','dismissed')),
  resolved_by   uuid references public.profiles(id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);
create index if not exists reports_target_idx
  on public.reports (target_type, target_id);

alter table public.reports enable row level security;

-- Reporter can insert their own reports
drop policy if exists "reports_owner_insert" on public.reports;
create policy "reports_owner_insert"
  on public.reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Reporter can read their own reports (so they can see status updates)
drop policy if exists "reports_owner_read" on public.reports;
create policy "reports_owner_read"
  on public.reports for select
  to authenticated
  using (reporter_id = auth.uid());

-- No update/delete policies. Admins moderate via the service role.

-- ---------- admin_actions audit log ----------------------------------
-- Every moderation action writes a row here. Service-role only —
-- admins write via API routes / Server Actions; nobody reads from the
-- client side.

create table if not exists public.admin_actions (
  id            uuid primary key default gen_random_uuid(),
  admin_id      uuid not null references public.profiles(id),
  action_type   text not null,           -- 'dismiss_report' | 'resolve_report' | 'remove_target'
  target_type   text,                     -- 'listing' | 'wanted' | 'message' | null
  target_id     uuid,
  report_id     uuid references public.reports(id),
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists admin_actions_created_idx
  on public.admin_actions (created_at desc);
create index if not exists admin_actions_admin_idx
  on public.admin_actions (admin_id, created_at desc);

alter table public.admin_actions enable row level security;
-- No policies — service role only.
