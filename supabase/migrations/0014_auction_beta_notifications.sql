-- Auction BETA: verified notification email and richer bid RPC output.

alter table public.profiles
  add column if not exists email_verified_at timestamptz;

create table if not exists public.email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_profile_idx
  on public.email_verification_tokens (profile_id, created_at desc);

alter table public.email_verification_tokens enable row level security;
-- Intentionally no client policies; verification tokens are service-role only.

-- PostgreSQL cannot change an existing function's return table in place.
drop function if exists public.place_auction_bid(uuid, integer);

create function public.place_auction_bid(p_auction_id uuid, p_max_amount_eur integer)
returns table(
  current_price_eur integer,
  bidder_is_winning boolean,
  ends_at timestamptz,
  seller_id uuid,
  outbid_bidder_id uuid,
  plate_text text
)
language plpgsql security definer set search_path = public as $$
declare
  a public.auctions%rowtype;
  top_bid public.auction_bids%rowtype;
  second_max integer;
  previous_price integer;
  previous_winner uuid;
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

  previous_winner := a.winner_id;

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
    ends_at = case when public.auctions.ends_at - now() <= interval '2 minutes' then public.auctions.ends_at + interval '2 minutes' else public.auctions.ends_at end
  where id = p_auction_id returning public.auctions.ends_at into a.ends_at;

  insert into public.auction_bid_events (auction_id, displayed_price_eur)
  values (p_auction_id, next_price);

  return query select
    next_price,
    top_bid.bidder_id = auth.uid(),
    a.ends_at,
    a.seller_id,
    case when previous_winner is not null and previous_winner <> top_bid.bidder_id then previous_winner else null end,
    a.plate_text;
end
$$;

revoke all on function public.place_auction_bid(uuid, integer) from public;
grant execute on function public.place_auction_bid(uuid, integer) to authenticated;
