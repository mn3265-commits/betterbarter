-- The queue of photos that are no longer attached to anything.
--
-- The rows in this database are not the problem — the whole thing is 12 MB, and
-- ten thousand listings would be a handful more. The photos are: a few MB each,
-- four to a listing, on a 1 GB plan. This is the one place where "not filling
-- the place with rubbish" is a real number rather than a nice sentiment.
--
-- Postgres cannot delete out of object storage, so the lifecycle job writes the
-- paths here and /ops empties it through the Storage API.

create table if not exists storage_reclaim (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid references listings (id) on delete set null,
  path        text not null,
  queued_at   timestamptz not null default now(),
  deleted_at  timestamptz,
  unique (path)
);

create index if not exists storage_reclaim_pending_idx on storage_reclaim (queued_at) where deleted_at is null;

alter table storage_reclaim enable row level security;

drop policy if exists reclaim_founder on storage_reclaim;
create policy reclaim_founder on storage_reclaim
  for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_founder))
  with check   (exists (select 1 from profiles p where p.id = auth.uid() and p.is_founder));

-- A founder may delete an orphaned photo out of the bucket. Nobody else can
-- touch a file outside their own folder.
drop policy if exists "listing photos founder reclaim" on storage.objects;
create policy "listing photos founder reclaim" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'listing-photos'
    and exists (select 1 from profiles p where p.id = auth.uid() and p.is_founder)
  );

create or replace function mark_photo_reclaimed(p_path text) returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles p where p.id = auth.uid() and p.is_founder) then
    return false;
  end if;
  update storage_reclaim set deleted_at = now() where path = p_path and deleted_at is null;
  return found;
end;
$$;

revoke execute on function mark_photo_reclaimed(text) from public, anon;
grant  execute on function mark_photo_reclaimed(text) to authenticated;
