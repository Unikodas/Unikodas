-- Timed, moderated auctions with private automatic (proxy) bidding.

create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  plate_text text not null check (char_length(plate_text) between 1 and 20),
  plate_type text not null,
  flag_type text not null,
  city text not null,
  description text,
  start_price_eur integer not null check (start_price_eur >= 1),
  reserve_price_eur integer check (reserve_price_eur is null or reserve_price_eur >= start_price_eur),
  current_price_eur integer not null check (current_price_eur >= 1),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'pending'
    check (status in ('pending','scheduled','live','ended','cancelled','rejected')),
  winner_id uuid references public.profiles(id) on delete set null,
  bid_count integer not null default 0 check (bid_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists auctions_public_idx on public.auctions (status, ends_at);
create index if not exists auctions_seller_idx on public.auctions (seller_id, created_at desc);

drop trigger if exists auctions_updated_at on public.auctions;
create trigger auctions_updated_at before update on public.auctions
  for each row execute function public.set_updated_at();

-- max_amount_eur is deliberately private. It must never be returned by a public view.
create table if not exists public.auction_bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id) on delete cascade,
  max_amount_eur integer not null check (max_amount_eur >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auction_id, bidder_id)
);

create index if not exists auction_bids_rank_idx
  on public.auction_bids (auction_id, max_amount_eur desc, created_at asc);

drop trigger if exists auction_bids_updated_at on public.auction_bids;
create trigger auction_bids_updated_at before update on public.auction_bids
  for each row execute function public.set_updated_at();

-- Public-safe history: bidder identity and maximum bid are never recorded here.
create table if not exists public.auction_bid_events (
  id bigint generated always as identity primary key,
  auction_id uuid not null references public.auctions(id) on delete cascade,
  displayed_price_eur integer not null,
  created_at timestamptz not null default now()
);

create index if not exists auction_bid_events_idx
  on public.auction_bid_events (auction_id, created_at desc);

alter table public.auctions enable row level security;
alter table public.auction_bids enable row level security;
alter table public.auction_bid_events enable row level security;

drop policy if exists "auctions_owner_read" on public.auctions;
drop policy if exists "auctions_owner_submit" on public.auctions;
drop policy if exists "auction_events_public_read" on public.auction_bid_events;

create policy "auctions_owner_read" on public.auctions for select
  using (seller_id = auth.uid());
create policy "auctions_owner_submit" on public.auctions for insert
  with check (seller_id = auth.uid() and status = 'pending');
create policy "auction_events_public_read" on public.auction_bid_events for select
  using (exists (
    select 1 from public.auctions a
    where a.id = auction_id and a.status in ('scheduled','live','ended')
  ));

-- Deliberately excludes reserve_price_eur and winner_id. Public clients learn
-- whether the reserve was met, never the seller's exact threshold.
create or replace view public.public_auctions as
  select id, seller_id, plate_text, plate_type, flag_type, city, description,
    start_price_eur, current_price_eur, starts_at, ends_at, status, bid_count,
    (reserve_price_eur is null or current_price_eur >= reserve_price_eur) as reserve_met,
    created_at, updated_at
  from public.auctions
  where status in ('scheduled','live','ended');

grant select on public.public_auctions to anon, authenticated;

-- Returns the minimum sensible increment for the current visible price.
create or replace function public.auction_increment(amount integer)
returns integer language sql immutable as $$
  select case
    when amount < 100 then 5
    when amount < 500 then 10
    when amount < 2000 then 25
    when amount < 5000 then 50
    else 100
  end
$$;

-- Atomic bidding. Row locks serialize simultaneous bids and prevent stale-price races.
create or replace function public.place_auction_bid(p_auction_id uuid, p_max_amount_eur integer)
returns table(current_price_eur integer, bidder_is_winning boolean, ends_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  a public.auctions%rowtype;
  top_bid public.auction_bids%rowtype;
  second_max integer;
  previous_price integer;
  next_price integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_max_amount_eur is null or p_max_amount_eur < 1 then raise exception 'invalid_bid'; end if;

  select * into a from public.auctions where id = p_auction_id for update;
  if not found then raise exception 'auction_not_found'; end if;
  if a.seller_id = auth.uid() then raise exception 'seller_cannot_bid'; end if;
  if a.status not in ('scheduled','live') or now() < a.starts_at or now() >= a.ends_at then
    raise exception 'auction_not_live';
  end if;
  if p_max_amount_eur < a.current_price_eur + public.auction_increment(a.current_price_eur) then
    raise exception 'bid_too_low';
  end if;

  insert into public.auction_bids (auction_id, bidder_id, max_amount_eur)
  values (p_auction_id, auth.uid(), p_max_amount_eur)
  on conflict (auction_id, bidder_id) do update
    set max_amount_eur = greatest(auction_bids.max_amount_eur, excluded.max_amount_eur);

  select * into top_bid from public.auction_bids
    where auction_id = p_auction_id
    order by max_amount_eur desc, created_at asc limit 1;
  select max(max_amount_eur) into second_max from public.auction_bids
    where auction_id = p_auction_id and bidder_id <> top_bid.bidder_id;

  previous_price := a.current_price_eur;
  next_price := case
    when second_max is null and a.bid_count = 0 then a.start_price_eur
    when second_max is null then previous_price
    else least(top_bid.max_amount_eur, second_max + public.auction_increment(second_max))
  end;
  next_price := greatest(previous_price, next_price);

  update public.auctions set
    status = 'live', current_price_eur = next_price, winner_id = top_bid.bidder_id,
    bid_count = bid_count + 1,
    ends_at = case when ends_at - now() <= interval '2 minutes' then ends_at + interval '2 minutes' else ends_at end
  where id = p_auction_id returning public.auctions.ends_at into a.ends_at;

  insert into public.auction_bid_events (auction_id, displayed_price_eur)
  values (p_auction_id, next_price);

  return query select next_price, top_bid.bidder_id = auth.uid(), a.ends_at;
end
$$;

revoke all on function public.place_auction_bid(uuid, integer) from public;
grant execute on function public.place_auction_bid(uuid, integer) to authenticated;
