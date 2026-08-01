-- Partner listings: the raw promotion code is never stored.
alter table public.listings
  add column if not exists partner_tier text;

alter table public.listings
  drop constraint if exists listings_partner_tier_check;

alter table public.listings
  add constraint listings_partner_tier_check
  check (partner_tier is null or partner_tier in ('nightrider'));

create index if not exists listings_active_partner_created_idx
  on public.listings (status, partner_tier, created_at desc);
