-- What the team asked the listing form to collect, and what a completed handoff
-- leaves behind.
--
-- Four photos rather than one, because a desk photographed from one angle is a
-- desk nobody trusts. Dimensions and brand, because "will it fit" and "is it the
-- good one" are the two questions every message thread opens with.
--
-- And ratings: the only thing that makes a stranger on a board safe to meet is
-- that other people have met them already. A rating can only be written by
-- someone who was actually in a handoff that actually completed — enforced in
-- the policy, not in the client.

alter table listings
  add column if not exists dimensions   text,
  add column if not exists brand        text,
  add column if not exists photo_paths  text[] not null default '{}';

comment on column listings.photo_paths is
  'Up to four photos. photo_path stays as the first one so older clients keep working.';
comment on column listings.dimensions is
  'Size, where it matters — a rug, a fridge, a desk. Free text, because a tape measure is.';

alter table profiles
  add column if not exists pronouns     text,
  add column if not exists about        text,
  add column if not exists avatar_path  text;

comment on column profiles.pronouns is 'Shown next to the name wherever the person appears.';
comment on column profiles.about is 'A couple of lines the person writes about themselves.';

create table if not exists ratings (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references threads (id) on delete cascade,
  rater_id   uuid not null references profiles (id) on delete cascade,
  ratee_id   uuid not null references profiles (id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  note       text,
  created_at timestamptz not null default now(),
  unique (thread_id, rater_id)
);

alter table ratings enable row level security;

drop policy if exists ratings_read on ratings;
create policy ratings_read on ratings
  for select using (
    exists (select 1 from profiles p where p.id = ratings.ratee_id and p.campus_id = current_campus())
  );

drop policy if exists ratings_insert_own on ratings;
create policy ratings_insert_own on ratings
  for insert with check (
    rater_id = auth.uid()
    and ratee_id <> auth.uid()
    and exists (
      select 1 from threads t
      where t.id = ratings.thread_id
        and t.completed_at is not null
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
        and ratings.ratee_id in (t.buyer_id, t.seller_id, coalesce(t.helper_id, t.buyer_id))
    )
  );

create or replace function rating_summary(p_user uuid)
  returns table (average numeric, total bigint)
  language sql stable security definer set search_path = public as $$
  select round(avg(r.stars)::numeric, 1), count(*)
    from ratings r
    join profiles p on p.id = r.ratee_id
   where r.ratee_id = p_user
     and p.campus_id = current_campus()
$$;

revoke execute on function rating_summary(uuid) from public;
grant execute on function rating_summary(uuid) to authenticated;
