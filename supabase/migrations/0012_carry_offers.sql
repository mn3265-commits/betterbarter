-- Carrying, as an actual flow rather than a flag.
--
--   1. Whoever posts (or claims) marks the item as needing two people.
--   2. Anyone on the same campus can offer to carry it, with their price.
--   3. The owner accepts one offer. That person becomes the thread's helper.
--   4. When the handoff completes, the helper gets a carry counted.
--
-- The money is agreed in the offer and paid directly between them, like every
-- other payment on this board: nothing is held here, and no fee is taken.

create table if not exists carry_offers (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  helper_id  uuid not null references profiles (id) on delete cascade,
  fee        integer,
  note       text,
  status     text not null default 'pending' check (status in ('pending','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  unique (listing_id, helper_id)
);

create index if not exists carry_offers_listing_idx on carry_offers (listing_id, status);

alter table carry_offers enable row level security;

-- Visible to the person who made it and to the listing's owner; nobody else
-- needs to see who offered to carry what.
drop policy if exists carry_read on carry_offers;
create policy carry_read on carry_offers
  for select using (
    helper_id = auth.uid()
    or exists (select 1 from listings l where l.id = carry_offers.listing_id and l.seller_id = auth.uid())
  );

drop policy if exists carry_insert on carry_offers;
create policy carry_insert on carry_offers
  for insert with check (
    helper_id = auth.uid()
    and exists (
      select 1 from listings l
      where l.id = carry_offers.listing_id
        and l.campus_id = current_campus()
        and l.help_wanted
        and l.seller_id <> auth.uid()
        and l.status = 'active'
    )
  );

drop policy if exists carry_withdraw on carry_offers;
create policy carry_withdraw on carry_offers
  for update using (helper_id = auth.uid()) with check (helper_id = auth.uid());

-- Accepting is the owner's move, and it is the thing that attaches a helper to
-- the handoff — so it runs server-side rather than as a client update.
create or replace function accept_carry(p_offer uuid) returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  o carry_offers%rowtype;
  v_listing listings%rowtype;
begin
  select * into o from carry_offers where id = p_offer for update;
  if not found then return false; end if;

  select * into v_listing from listings where id = o.listing_id;
  if not found or v_listing.seller_id <> auth.uid() then
    raise exception 'Not your listing';
  end if;

  update carry_offers set status = 'accepted' where id = o.id;
  update carry_offers set status = 'declined'
   where listing_id = o.listing_id and id <> o.id and status = 'pending';

  -- Attach the helper to the open thread for this listing, if there is one.
  update threads set helper_id = o.helper_id
   where listing_id = o.listing_id and completed_at is null;

  insert into messages (thread_id, sender_id, body)
  select t.id, auth.uid(),
         'A carrier is booked for this handoff' || coalesce(' · $' || o.fee, '') || '.'
    from threads t
   where t.listing_id = o.listing_id and t.completed_at is null;

  return true;
end;
$$;

revoke execute on function accept_carry(uuid) from public;
grant execute on function accept_carry(uuid) to authenticated;
