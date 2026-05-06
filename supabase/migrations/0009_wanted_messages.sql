-- =====================================================================
-- 0009_wanted_messages.sql
-- Let the existing messages table carry wanted-listing conversation
-- context in addition to sale-listing context.
--
-- Apply via Supabase SQL Editor after 0008.
-- =====================================================================

alter table public.messages
  add column if not exists wanted_listing_id uuid
    references public.wanted_listings(id) on delete set null;

create index if not exists messages_wanted_listing_idx
  on public.messages (wanted_listing_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'messages_single_listing_context'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_single_listing_context
      check (listing_id is null or wanted_listing_id is null);
  end if;
end $$;
