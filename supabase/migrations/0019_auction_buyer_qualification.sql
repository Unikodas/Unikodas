-- Record permission to contact paid auction participants and let admins track
-- a lightweight buyer-qualification call workflow.

alter table public.auction_participations
  add column if not exists contact_consent_at timestamptz,
  add column if not exists call_status text not null default 'not_called'
    check (call_status in ('not_called', 'qualified', 'unreachable', 'not_serious')),
  add column if not exists called_at timestamptz,
  add column if not exists call_note text;

alter table public.auction_participations
  drop constraint if exists auction_participations_call_note_length;

alter table public.auction_participations
  add constraint auction_participations_call_note_length
  check (call_note is null or char_length(call_note) <= 500);

create index if not exists auction_participations_call_queue_idx
  on public.auction_participations (auction_id, status, call_status);
