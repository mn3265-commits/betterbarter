-- The photo-release step detached photos and queued nothing, which is the one
-- outcome worse than not running it at all: the listing forgets the path, so the
-- file stays in the bucket with nothing left pointing at it. Orphaned forever,
-- and invisible.
--
-- RETURNING hands back the row as it is *after* the update, and the update had
-- just set both photo columns to null — so every queued path was NULL and the
-- `p is not null` filter swallowed the lot. Read the paths first, then clear
-- them.
create or replace function run_lifecycle() returns json
  language plpgsql security definer set search_path = public as $$
declare
  v_prompted int := 0; v_paused int := 0; v_archived int := 0; v_reclaimed int := 0;
begin
  -- Day 7: mark that the owner has been asked.
  update listings
     set day7_prompt_at = now()
   where status = 'active'
     and day7_prompt_at is null
     and coalesce(confirmed_at, created_at) < now() - interval '7 days';
  get diagnostics v_prompted = row_count;

  -- 48 hours later with no answer: pause it.
  update listings
     set status = 'paused'
   where status = 'active'
     and day7_prompt_at is not null
     and day7_prompt_at < now() - interval '48 hours'
     and coalesce(confirmed_at, created_at) < now() - interval '7 days';
  get diagnostics v_paused = row_count;

  -- Answering the check clears the prompt so the next cycle can arm again.
  update listings
     set day7_prompt_at = null
   where day7_prompt_at is not null
     and confirmed_at is not null
     and confirmed_at > day7_prompt_at;

  -- Day 30 with nothing happening: off the shelf. Not deleted — the owner still
  -- finds it under Archived and can put it back in one tap.
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

  -- Day 90: release the photos. Queue the paths BEFORE clearing them.
  insert into storage_reclaim (listing_id, path)
  select l.id, p
    from listings l,
         unnest(coalesce(nullif(l.photo_paths, '{}'), array[l.photo_path])) p
   where l.status = 'archived'
     and l.archived_at < now() - interval '60 days'
     and p is not null
  on conflict (path) do nothing;
  get diagnostics v_reclaimed = row_count;

  update listings
     set photo_path = null, photo_paths = '{}'
   where status = 'archived'
     and archived_at < now() - interval '60 days'
     and (photo_path is not null or array_length(photo_paths, 1) > 0);

  return json_build_object(
    'prompted', v_prompted, 'paused', v_paused,
    'archived', v_archived, 'photosQueued', v_reclaimed);
end;
$$;

revoke all on function run_lifecycle() from public, anon, authenticated;
