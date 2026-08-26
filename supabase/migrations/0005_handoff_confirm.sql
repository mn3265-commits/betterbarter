-- The handoff confirmation loop.
--
-- Both people in a thread tap "handed off". The second tap is the one that
-- matters: it closes the listing, releases the 3-hour hold, and adds +1 to both
-- `profiles.handoffs` — the app's only reputation signal and its primary success
-- metric (handoffs per week per building).
--
-- Why an RPC rather than client-side updates: a person may only write their own
-- profile row (RLS), so nobody can increment the *other* side's count from the
-- browser. This function runs as owner, but re-checks that the caller is one of
-- the two participants before it touches anything.

alter table threads
  add column if not exists completed_at timestamptz;

comment on column threads.completed_at is
  'When both sides confirmed the handoff. Non-null = counted; the count never fires twice.';

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

  -- Lock the row: two people can tap at the same second, and only one of those
  -- taps may be the one that increments.
  select * into t from threads where id = p_thread for update;
  if not found then
    raise exception 'Handoff not found';
  end if;
  if t.buyer_id <> v_me and t.seller_id <> v_me then
    raise exception 'Not your handoff';
  end if;

  -- Already counted: report the finished state and change nothing.
  if t.completed_at is not null then
    return json_build_object(
      'buyerDone', t.buyer_done, 'sellerDone', t.seller_done, 'completed', true);
  end if;

  v_buyer  := case when t.buyer_id  = v_me then p_done else t.buyer_done  end;
  v_seller := case when t.seller_id = v_me then p_done else t.seller_done end;
  v_complete := v_buyer and v_seller;

  if v_complete then
    update threads
       set buyer_done      = true,
           seller_done     = true,
           completed_at    = now(),
           hold_expires_at = null      -- the hold has done its job
     where id = t.id;

    update profiles set handoffs = handoffs + 1
     where id in (t.buyer_id, t.seller_id);

    -- The item is off the board. A listing already marked gone stays gone.
    if t.listing_id is not null then
      update listings set status = 'gone' where id = t.listing_id;
    end if;

    -- Leave the record in the thread itself, so the conversation shows what
    -- happened without the app having to remember it.
    insert into messages (thread_id, sender_id, body)
    values (t.id, v_me, 'Handed off. +1 for both of us.');
  else
    update threads set buyer_done = v_buyer, seller_done = v_seller where id = t.id;
  end if;

  return json_build_object(
    'buyerDone', v_buyer, 'sellerDone', v_seller, 'completed', v_complete);
end;
$$;

revoke execute on function set_handoff_done(uuid, boolean) from public;
grant  execute on function set_handoff_done(uuid, boolean) to authenticated;
