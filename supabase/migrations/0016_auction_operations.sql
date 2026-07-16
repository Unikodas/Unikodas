create or replace function public.finalize_expired_auctions()
returns table(auction_id uuid, seller_id uuid, winner_id uuid, plate_text text, final_price_eur integer, sold boolean)
language plpgsql security definer set search_path = public as $$
begin
  return query
  with finished as (
    update public.auctions a
       set status = 'ended'
     where a.status in ('scheduled','live') and a.ends_at <= now()
     returning a.id, a.seller_id, a.winner_id, a.plate_text, a.current_price_eur,
       (a.winner_id is not null and (a.reserve_price_eur is null or a.current_price_eur >= a.reserve_price_eur)) as sold
  )
  select f.id, f.seller_id, case when f.sold then f.winner_id else null end,
         f.plate_text, f.current_price_eur, f.sold from finished f;
end;
$$;
revoke all on function public.finalize_expired_auctions() from public, anon, authenticated;

