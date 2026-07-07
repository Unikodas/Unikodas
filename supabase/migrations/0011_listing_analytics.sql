-- =====================================================================
-- 0011_listing_analytics.sql
-- Foundation for listing demand signals and future marketplace
-- intelligence. This migration only adds data structures and secure
-- server-side primitives; it does not expose public analytics.
-- =====================================================================

-- ---------- listing_events ------------------------------------------
-- Generic analytics/event log for listing demand signals.

create table if not exists public.listing_events (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  event_type  text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listing_events_event_type_check'
      and conrelid = 'public.listing_events'::regclass
  ) then
    alter table public.listing_events
      add constraint listing_events_event_type_check
      check (
        event_type in (
          'view',
          'favorite',
          'unfavorite',
          'contact',
          'message',
          'price_change',
          'marked_sold',
          'removed',
          'shared'
        )
      );
  end if;
end $$;

create index if not exists listing_events_listing_id_created_at_idx
  on public.listing_events (listing_id, created_at desc);

create index if not exists listing_events_event_type_created_at_idx
  on public.listing_events (event_type, created_at desc);

create index if not exists listing_events_user_id_created_at_idx
  on public.listing_events (user_id, created_at desc);

alter table public.listing_events enable row level security;

drop policy if exists "listing_events_authenticated_insert" on public.listing_events;
create policy "listing_events_authenticated_insert"
  on public.listing_events for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and event_type in (
      'view',
      'favorite',
      'unfavorite',
      'contact',
      'message',
      'shared'
    )
    and exists (
      select 1
      from public.listings
      where listings.id = listing_events.listing_id
    )
  );

-- No SELECT/UPDATE/DELETE policies on purpose. Raw event data is private
-- analytics and should only be accessed through trusted server code.

-- ---------- listing_price_history -----------------------------------
-- Append-only history for price changes.

create table if not exists public.listing_price_history (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  old_price   numeric,
  new_price   numeric not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists listing_price_history_listing_id_created_at_idx
  on public.listing_price_history (listing_id, created_at desc);

alter table public.listing_price_history enable row level security;

-- No policies yet: price history stays service-role only until a future
-- owner/admin analytics surface is designed.

-- ---------- lightweight listing counters ----------------------------

alter table public.listings
  add column if not exists view_count integer not null default 0,
  add column if not exists contact_count integer not null default 0,
  add column if not exists favorite_count integer not null default 0,
  add column if not exists share_count integer not null default 0,
  add column if not exists sold_at timestamptz,
  add column if not exists removed_at timestamptz,
  add column if not exists removal_reason text;

-- Atomic counter increment used only by server-side code with the
-- service role key. The counter name is whitelisted both here and in
-- src/lib/listing-analytics.ts.

create or replace function public.increment_listing_counter(
  p_listing_id uuid,
  p_counter_name text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  case p_counter_name
    when 'view_count' then
      update public.listings
         set view_count = view_count + 1
       where id = p_listing_id;
    when 'contact_count' then
      update public.listings
         set contact_count = contact_count + 1
       where id = p_listing_id;
    when 'favorite_count' then
      update public.listings
         set favorite_count = favorite_count + 1
       where id = p_listing_id;
    when 'share_count' then
      update public.listings
         set share_count = share_count + 1
       where id = p_listing_id;
    else
      raise exception 'invalid listing counter: %', p_counter_name;
  end case;
end;
$$;

revoke all on function public.increment_listing_counter(uuid, text)
  from public, anon, authenticated;
grant execute on function public.increment_listing_counter(uuid, text)
  to service_role;
