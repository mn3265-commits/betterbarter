-- The bucket the app had been uploading to since the day photos shipped.
--
-- It never existed, and uploadPhoto() swallowed the error on purpose so a
-- missing bucket could never stop someone posting — which is the right call for
-- the poster and the reason this went unnoticed: every listing simply arrived
-- without its photo. (The upload now throws, and the UI says so.)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-photos',
  'listing-photos',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif'];

-- Anyone may read: the board shows these photos, and the bucket is public.
drop policy if exists "listing photos readable" on storage.objects;
create policy "listing photos readable" on storage.objects
  for select using (bucket_id = 'listing-photos');

-- You may only write inside your own folder — the app uploads to <uid>/<uuid>.
drop policy if exists "listing photos insert own" on storage.objects;
create policy "listing photos insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listing photos update own" on storage.objects;
create policy "listing photos update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "listing photos delete own" on storage.objects;
create policy "listing photos delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
