-- A bidder pays once per auction before the database accepts any bids.
-- Payment completion is written only by the server-side Stripe integration.

create table if not exists public.auction_participations (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded')),
  amount_cents integer not null default 200 check (amount_cents = 200),
  currency text not null default 'eur' check (currency = 'eur'),
  provider text not null default 'stripe' check (provider = 'stripe'),
  provider_session_id text unique,
  provider_payment_intent_id text,
  terms_accepted_at timestamptz not null,
  captcha_verified_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auction_id, user_id)
);

create index if not exists auction_participations_auction_paid_idx
  on public.auction_participations (auction_id, status);

drop trigger if exists auction_participations_updated_at on public.auction_participations;
create trigger auction_participations_updated_at before update on public.auction_participations
  for each row execute function public.set_updated_at();

alter table public.auction_participations enable row level security;

drop policy if exists "auction_participations_self_read" on public.auction_participations;
create policy "auction_participations_self_read" on public.auction_participations for select
  using (user_id = auth.uid());

-- Defence in depth: even if a client invokes place_auction_bid directly,
-- PostgreSQL rejects the bid unless that user has a completed payment for
-- this exact auction.
create or replace function public.require_paid_auction_participation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.auction_participations p
    where p.auction_id = new.auction_id
      and p.user_id = new.bidder_id
      and p.status = 'paid'
      and p.amount_cents = 200
      and p.currency = 'eur'
  ) then
    raise exception 'auction_payment_required';
  end if;
  return new;
end
$$;

drop trigger if exists auction_bids_require_payment on public.auction_bids;
create trigger auction_bids_require_payment
  before insert or update on public.auction_bids
  for each row execute function public.require_paid_auction_participation();

revoke all on function public.require_paid_auction_participation() from public, anon, authenticated;

-- Keep the exact reserve private. Only publish whether it has been reached,
-- plus the number of users who completed auction entry.
create or replace view public.public_auctions as
  select a.id, a.seller_id, a.plate_text, a.plate_type, a.flag_type, a.city,
    a.description, a.start_price_eur, a.current_price_eur, a.starts_at,
    a.ends_at, a.status, a.bid_count,
    (a.reserve_price_eur is null or a.current_price_eur >= a.reserve_price_eur) as reserve_met,
    a.created_at, a.updated_at,
    (select count(*)::integer from public.auction_participations p
      where p.auction_id = a.id and p.status = 'paid') as participant_count
  from public.auctions a
  where a.status in ('scheduled','live','ended');

grant select on public.public_auctions to anon, authenticated;
