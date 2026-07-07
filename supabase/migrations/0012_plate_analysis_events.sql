-- =====================================================================
-- 0012_plate_analysis_events.sql
-- Private event log for the public number plate analysis tool.
-- =====================================================================

create table if not exists public.plate_analysis_events (
  id               uuid primary key default gen_random_uuid(),
  plate            text not null check (char_length(plate) between 1 and 15),
  normalized_plate text not null check (char_length(normalized_plate) between 1 and 15),
  score            integer check (score between 0 and 100),
  used_ai          boolean not null default false,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists plate_analysis_events_created_at_idx
  on public.plate_analysis_events (created_at desc);

create index if not exists plate_analysis_events_normalized_plate_idx
  on public.plate_analysis_events (normalized_plate);

alter table public.plate_analysis_events enable row level security;

-- No public SELECT/UPDATE/DELETE policies. Events are written by trusted
-- server-side code with the service role key and stay private analytics.
