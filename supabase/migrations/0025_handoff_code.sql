-- Proving the two of them were actually standing there.
--
-- Until now a handoff completed because both people tapped a button, and a
-- button can be tapped from bed. That was fine while the count was a nicety.
-- It is not fine now that the count is the carbon number on a competition
-- form: a number anyone can inflate alone is not evidence of anything.
--
-- So: six digits, split down the middle. The buyer's app shows the first three,
-- the seller's the last three, and neither can see the other's. At the handover
-- one reads their half aloud, the other types all six, and the handoff
-- completes for both. You cannot produce those six digits without having been
-- within earshot of the other person.
--
-- It is a speed bump, not a vault — two people determined to fake it can read
-- the digits to each other. But it cannot happen by accident, it cannot happen
-- alone, and faking it takes a deliberate conversation that has to happen
-- inside a thread we can see. That is the honest claim, and it is the one the
-- impact number now rests on.

alter table threads
  add column if not exists handoff_code     text,
  add column if not exists code_attempts    smallint    not null default 0,
  add column if not exists code_verified_at timestamptz;

comment on column threads.handoff_code is
  'Six digits, never readable by a client — see 0026. Each side fetches only its own half through my_handoff_half().';
comment on column threads.code_verified_at is
  'Set when the two halves were put back together in person. A handoff without this completed on trust alone, and is reported separately.';

create or replace function new_handoff_code() returns text
  language sql volatile set search_path = public as $$
  select lpad(((
    get_byte(extensions.gen_random_bytes(3), 0)::bigint * 65536 +
    get_byte(extensions.gen_random_bytes(3), 1)::bigint * 256 +
    get_byte(extensions.gen_random_bytes(3), 2)::bigint
  ) % 1000000)::text, 6, '0')
$$;

create or replace function set_handoff_code() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if new.handoff_code is null then
    new.handoff_code := new_handoff_code();
  end if;
  return new;
end;
$$;

drop trigger if exists thread_handoff_code on threads;
create trigger thread_handoff_code before insert on threads
  for each row execute function set_handoff_code();

update threads set handoff_code = new_handoff_code()
 where handoff_code is null and completed_at is null;

revoke all on function new_handoff_code() from public, anon, authenticated;
revoke all on function set_handoff_code() from public, anon, authenticated;

-- Your half, and only yours.
create or replace function my_handoff_half(p_thread uuid) returns json
  language plpgsql stable security definer set search_path = public as $$
declare t threads%rowtype; v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'Not signed in'; end if;
  select * into t from threads where id = p_thread;
  if not found or (t.buyer_id <> v_me and t.seller_id <> v_me) then
    raise exception 'Not your handoff';
  end if;
  if t.handoff_code is null then
    update threads set handoff_code = new_handoff_code() where id = t.id
      returning handoff_code into t.handoff_code;
  end if;

  return json_build_object(
    'half',     case when t.buyer_id = v_me then left(t.handoff_code, 3) else right(t.handoff_code, 3) end,
    'position', case when t.buyer_id = v_me then 'first' else 'last' end,
    'verified', t.code_verified_at is not null,
    'attempts', t.code_attempts);
end;
$$;

-- Putting the halves back together. The only thing that completes a handoff in
-- one move, and it credits both sides at once.
create or replace function confirm_handoff_code(p_thread uuid, p_code text) returns json
  language plpgsql security definer set search_path = public as $$
declare
  t      threads%rowtype;
  v_me   uuid := auth.uid();
  v_code text := regexp_replace(coalesce(p_code, ''), '\D', '', 'g');
begin
  if v_me is null then raise exception 'Not signed in'; end if;

  select * into t from threads where id = p_thread for update;
  if not found or (t.buyer_id <> v_me and t.seller_id <> v_me) then
    raise exception 'Not your handoff';
  end if;

  if t.completed_at is not null then
    return json_build_object('ok', true, 'completed', true, 'alreadyDone', true);
  end if;

  -- Five wrong guesses is far more than a person mistypes, and far fewer than
  -- the thousand it would take to find the other half.
  if t.code_attempts >= 5 then
    return json_build_object('ok', false, 'lockedOut', true,
      'why', 'Too many wrong codes. Ask them to read their three digits out again, and message us if it still will not go.');
  end if;

  if v_code <> t.handoff_code then
    update threads set code_attempts = code_attempts + 1 where id = t.id;
    return json_build_object('ok', false, 'attemptsLeft', 4 - t.code_attempts,
      'why', 'That is not the code. Check you have both halves, in order: their three then yours, or yours then theirs.');
  end if;

  update threads
     set buyer_done = true, seller_done = true,
         completed_at = now(), code_verified_at = now(), hold_expires_at = null
   where id = t.id;

  update profiles set handoffs = handoffs + 1 where id in (t.buyer_id, t.seller_id);

  if t.helper_id is not null and t.helper_id not in (t.buyer_id, t.seller_id) then
    update profiles set carries = carries + 1 where id = t.helper_id;
  end if;

  if t.listing_id is not null then
    update listings set status = 'gone' where id = t.listing_id;
  end if;

  insert into messages (thread_id, sender_id, body)
  values (t.id, v_me, 'Handed off, confirmed in person. +1 for both of us.');

  return json_build_object('ok', true, 'completed', true, 'verified', true);
end;
$$;

revoke execute on function my_handoff_half(uuid) from public, anon;
grant  execute on function my_handoff_half(uuid) to authenticated;
revoke execute on function confirm_handoff_code(uuid, text) from public, anon;
grant  execute on function confirm_handoff_code(uuid, text) to authenticated;
