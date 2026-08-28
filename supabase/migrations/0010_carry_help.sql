-- Some objects need two people, and a campus already has the two people.
--
-- The alternative to a van is not "nobody can move a fridge" — it is a student
-- with an hour and a trolley, paid directly by whoever needed the help. That
-- keeps the transport term at zero (a walk across a campus emits nothing) and
-- keeps the money between two verified people, which is where all money on this
-- board already sits.

alter table listings
  add column if not exists help_wanted boolean not null default false,
  add column if not exists help_fee    integer;

comment on column listings.help_wanted is
  'The owner says this needs a second pair of hands or a trolley. Surfaces the listing to students offering to carry.';
comment on column listings.help_fee is
  'What the owner suggests paying for the carry, in whole units of currency. Settled between the two of them; BetterBarter never holds it.';

alter table profiles
  add column if not exists carries integer not null default 0;

comment on column profiles.carries is
  'Completed carries — the public count for helping move other people''s things, kept separate from handoffs.';

alter table threads
  add column if not exists helper_id uuid references profiles (id) on delete set null;

comment on column threads.helper_id is
  'The student who carried, when one was involved. Gets a carry counted on completion.';

-- The confirmation loop now also credits whoever carried it.
create or replace function set_handoff_done(p_thread uuid, p_done boolean default true)
  returns json
  language plpgsql security definer set search_path = public as $$
declare
  t          threads%rowtype;
  v_me       uuid := auth.uid();
  v_buyer    boolean;
  v_seller   boolean;
  v_complete boolean := false;
begin
  if v_me is null then
    raise exception 'Not signed in';
  end if;

  select * into t from threads where id = p_thread for update;
  if not found then
    raise exception 'Handoff not found';
  end if;
  if t.buyer_id <> v_me and t.seller_id <> v_me then
    raise exception 'Not your handoff';
  end if;

  if t.completed_at is not null then
    return json_build_object(
      'buyerDone', t.buyer_done, 'sellerDone', t.seller_done, 'completed', true);
  end if;

  v_buyer  := case when t.buyer_id  = v_me then p_done else t.buyer_done  end;
  v_seller := case when t.seller_id = v_me then p_done else t.seller_done end;
  v_complete := v_buyer and v_seller;

  if v_complete then
    update threads
       set buyer_done = true, seller_done = true,
           completed_at = now(), hold_expires_at = null
     where id = t.id;

    update profiles set handoffs = handoffs + 1
     where id in (t.buyer_id, t.seller_id);

    if t.helper_id is not null and t.helper_id not in (t.buyer_id, t.seller_id) then
      update profiles set carries = carries + 1 where id = t.helper_id;
    end if;

    if t.listing_id is not null then
      update listings set status = 'gone' where id = t.listing_id;
    end if;

    insert into messages (thread_id, sender_id, body)
    values (t.id, v_me, 'Handed off. +1 for both of us.');
  else
    update threads set buyer_done = v_buyer, seller_done = v_seller where id = t.id;
  end if;

  return json_build_object(
    'buyerDone', v_buyer, 'sellerDone', v_seller, 'completed', v_complete);
end;
$$;
