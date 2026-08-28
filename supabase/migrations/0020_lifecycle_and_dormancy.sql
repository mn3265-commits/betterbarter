-- Letting things age out, without letting history go with them.
--
-- A board full of listings that went weeks ago is not a full board, it is a
-- broken one: someone messages about a desk that left in May, hears nothing,
-- and does not come back. That is a *reuse* failure, and it is the reason to do
-- this. It is not a storage one — the entire database is 12 MB, and ten thousand
-- listings would be a handful more. The photos are the only thing that costs
-- anything real: a few MB each, four to a listing, on a 1 GB plan. Four orders
-- of magnitude between the two, so the photos are what the last step releases.
--
-- Listings age out. Accounts do not — see the note at the bottom.

alter table listings
  add column if not exists archived_at timestamptz;

alter table profiles
  add column if not exists last_seen_at    timestamptz,
  add column if not exists deactivated_at  timestamptz;

comment on column profiles.last_seen_at is
  'Stamped by the client on load. Until this existed, dormancy was not measurable at all.';
comment on column profiles.deactivated_at is
  'The person asked to be taken off the board. Their listings go quiet; everything they and other people did together stays. Reversed by signing back in.';

create index if not exists listings_lifecycle_idx on listings (status, confirmed_at, created_at);

-- ── The staircase ────────────────────────────────────────────────────────────
--   day 7   a listing is asked whether it is still here      (was already here)
--   day 9   no answer, it pauses itself                      (was already here)
--   day 30  still nothing, it comes off the shelf
--   day 90  its photos are released
--
-- Every step is reversible by the owner except the last, and the last only
-- costs a photo. "Still here", "Make it free" and "Relist" all stamp
-- confirmed_at, which puts the listing back at the top of the staircase.
--
-- A listing with a live conversation or a completed handoff never archives,
-- however old it is.
--
-- (0022 corrects the photo step; this is the body as first written.)
create or replace function run_lifecycle() returns json
  language plpgsql security definer set search_path = public as $$
declare
  v_prompted int := 0; v_paused int := 0; v_archived int := 0; v_reclaimed int := 0;
begin
  update listings
     set day7_prompt_at = now()
   where status = 'active'
     and day7_prompt_at is null
     and coalesce(confirmed_at, created_at) < now() - interval '7 days';
  get diagnostics v_prompted = row_count;

  update listings
     set status = 'paused'
   where status = 'active'
     and day7_prompt_at is not null
     and day7_prompt_at < now() - interval '48 hours'
     and coalesce(confirmed_at, created_at) < now() - interval '7 days';
  get diagnostics v_paused = row_count;

  update listings
     set day7_prompt_at = null
   where day7_prompt_at is not null
     and confirmed_at is not null
     and confirmed_at > day7_prompt_at;

  update listings
     set status = 'archived', archived_at = now()
   where status = 'paused'
     and coalesce(confirmed_at, created_at) < now() - interval '30 days'
     and not exists (
       select 1 from threads t
        where t.listing_id = listings.id
          and (t.completed_at is not null or t.created_at > now() - interval '30 days')
     );
  get diagnostics v_archived = row_count;

  with released as (
    update listings
       set photo_path = null, photo_paths = '{}'
     where status = 'archived'
       and archived_at < now() - interval '60 days'
       and (photo_path is not null or array_length(photo_paths, 1) > 0)
    returning id, coalesce(nullif(photo_paths, '{}'), array[photo_path]) as paths
  )
  insert into storage_reclaim (listing_id, path)
  select r.id, p from released r, unnest(r.paths) p where p is not null;
  get diagnostics v_reclaimed = row_count;

  return json_build_object(
    'prompted', v_prompted, 'paused', v_paused,
    'archived', v_archived, 'photosQueued', v_reclaimed);
end;
$$;

revoke all on function run_lifecycle() from public, anon, authenticated;

-- ── Accounts ─────────────────────────────────────────────────────────────────
-- Deliberately NOT on a timer. This product is seasonal: someone lists a desk in
-- May, disappears for the summer, and comes back in September. That is not a
-- dormant user, that is the user. A 30-day rule would deactivate exactly the
-- people the whole thing depends on.
--
-- What accounts need is a door marked "take me off", and it is a door, not a
-- trapdoor: signing back in undoes it.
--
-- What survives either way: every completed handoff, every rating, every handoff
-- count, every kilogram in the impact ledger. Not out of tidiness — because none
-- of it is only yours. A rating you wrote is someone else's reputation, and a
-- handoff you completed is on someone else's record too. That is also why there
-- is no hard delete here: `threads.buyer_id` and `ratings.rater_id` are ON
-- DELETE CASCADE, so removing one profile row would quietly take other students'
-- history with it.
create or replace function deactivate_my_account() returns json
  language plpgsql security definer set search_path = public as $$
declare v_hidden int := 0;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;

  update profiles set deactivated_at = now() where id = auth.uid();

  update listings set status = 'paused'
   where seller_id = auth.uid() and status = 'active';
  get diagnostics v_hidden = row_count;

  delete from wanted_posts where author_id = auth.uid();

  return json_build_object('listingsHidden', v_hidden, 'deactivatedAt', now());
end;
$$;

create or replace function reactivate_my_account() returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  update profiles set deactivated_at = null, last_seen_at = now() where id = auth.uid();
  return true;
end;
$$;

-- The client stamps this on load; it is the only way dormancy is measurable.
create or replace function touch_last_seen() returns void
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  update profiles set last_seen_at = now()
   where id = auth.uid()
     and (last_seen_at is null or last_seen_at < now() - interval '1 hour');
end;
$$;

revoke execute on function deactivate_my_account() from public, anon;
grant  execute on function deactivate_my_account() to authenticated;
revoke execute on function reactivate_my_account() from public, anon;
grant  execute on function reactivate_my_account() to authenticated;
revoke execute on function touch_last_seen() from public, anon;
grant  execute on function touch_last_seen() to authenticated;

-- ── What the board shows ─────────────────────────────────────────────────────
-- Archived listings and deactivated people leave the board. The owner still
-- sees their own; blocks still apply.
drop policy if exists listings_read on listings;
create policy listings_read on listings
  for select using (
    campus_id = current_campus()
    and (
      seller_id = auth.uid()
      or (
        status = 'active'
        and not exists (select 1 from profiles s where s.id = listings.seller_id and s.deactivated_at is not null)
      )
    )
    and not exists (
      select 1 from blocks b where b.blocker_id = auth.uid() and b.blocked_id = listings.seller_id
    )
  );

drop policy if exists wanted_read on wanted_posts;
create policy wanted_read on wanted_posts
  for select using (
    campus_id = current_campus()
    and not exists (
      select 1 from blocks b where b.blocker_id = auth.uid() and b.blocked_id = wanted_posts.author_id
    )
    and not exists (
      select 1 from profiles s where s.id = wanted_posts.author_id and s.deactivated_at is not null
    )
  );
