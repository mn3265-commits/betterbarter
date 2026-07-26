-- Handoff — initial schema.
--
-- Design rules that drive this schema:
--   * Every campus is its own isolated board. Isolation is enforced in the
--     database with row-level security keyed to the viewer's campus, NOT in the
--     client — a query can never reach across campuses.
--   * The only trust mechanism is a verified school email + a public handoff
--     count. Accounts live in Supabase Auth; `profiles` extends them.
--   * Paused and gone listings must never appear on the board.
--
-- Apply with: supabase db push   (or paste into the SQL editor).

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────
create type listing_status as enum ('active', 'paused', 'gone');
create type thread_role     as enum ('buyer', 'seller');

-- ─────────────────────────────────────────────────────────────────────────────
-- Campuses and the email domains that map into them
-- ─────────────────────────────────────────────────────────────────────────────
create table campuses (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

-- A school email domain gates sign-up to a campus. Columbia is the pilot.
create table campus_domains (
  domain     text primary key,           -- e.g. 'columbia.edu'
  campus_id  uuid not null references campuses (id) on delete cascade
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles — one row per auth user, extending auth.users
-- ─────────────────────────────────────────────────────────────────────────────
create table profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  campus_id        uuid not null references campuses (id),
  name             text not null,
  email            text not null,
  building         text,
  handoffs         integer not null default 0,   -- the public reputation number
  no_shows         integer not null default 0,
  read_only        boolean not null default false, -- set when re-verification fails
  last_verified_at timestamptz not null default now(),
  joined_at        timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Per-campus meetup spots, built by students (not by us) with a use count
-- ─────────────────────────────────────────────────────────────────────────────
create table meetup_spots (
  id         uuid primary key default gen_random_uuid(),
  campus_id  uuid not null references campuses (id) on delete cascade,
  name       text not null,
  uses       integer not null default 0,
  created_at timestamptz not null default now(),
  unique (campus_id, name)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Listings
-- ─────────────────────────────────────────────────────────────────────────────
create table listings (
  id             uuid primary key default gen_random_uuid(),
  campus_id      uuid not null references campuses (id) on delete cascade,
  seller_id      uuid not null references profiles (id) on delete cascade,
  title          text not null,
  description    text not null default '',
  is_free        boolean not null default true,
  price          integer,                       -- null when is_free
  category       text not null default 'Other',
  condition      text not null default 'Used',
  building       text,                          -- seller's building, for distance sort
  spot_id        uuid references meetup_spots (id),
  spot_name      text not null,                 -- denormalized public spot name
  status         listing_status not null default 'active',
  photo_path     text,                          -- Storage object path
  created_at     timestamptz not null default now(),
  confirmed_at   timestamptz,                   -- last day-7 "still here" confirmation
  day7_prompt_at timestamptz,                   -- when the day-7 check fired
  constraint price_matches_free check (is_free = (price is null))
);

create index listings_board_idx on listings (campus_id, status, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Wanted posts — the board in reverse
-- ─────────────────────────────────────────────────────────────────────────────
create table wanted_posts (
  id         uuid primary key default gen_random_uuid(),
  campus_id  uuid not null references campuses (id) on delete cascade,
  author_id  uuid not null references profiles (id) on delete cascade,
  title      text not null,
  max_price  integer,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Threads + messages. A thread is created on claim, with the meetup baked in.
-- ─────────────────────────────────────────────────────────────────────────────
create table threads (
  id             uuid primary key default gen_random_uuid(),
  campus_id      uuid not null references campuses (id) on delete cascade,
  listing_id     uuid references listings (id) on delete set null,
  buyer_id       uuid not null references profiles (id) on delete cascade,
  seller_id      uuid not null references profiles (id) on delete cascade,
  spot_name      text not null,
  pickup_window  text not null,
  hold_expires_at timestamptz,                  -- claim holds the item for 3 hours
  buyer_done     boolean not null default false, -- both true => release + increment
  seller_done    boolean not null default false,
  created_at     timestamptz not null default now()
);

create table messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references threads (id) on delete cascade,
  sender_id  uuid not null references profiles (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

create index messages_thread_idx on messages (thread_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Saved searches (drive push notifications, out of scope for this migration)
-- ─────────────────────────────────────────────────────────────────────────────
create table saved_searches (
  id             uuid primary key default gen_random_uuid(),
  campus_id      uuid not null references campuses (id) on delete cascade,
  user_id        uuid not null references profiles (id) on delete cascade,
  query          text not null,
  max_price      integer,
  alerts_enabled boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Helpers
-- ─────────────────────────────────────────────────────────────────────────────

-- The signed-in user's campus. SECURITY DEFINER so RLS policies can call it
-- without recursing into the profiles policy.
create or replace function current_campus() returns uuid
  language sql stable security definer set search_path = public as $$
  select campus_id from profiles where id = auth.uid()
$$;

-- On sign-up, derive the campus from the email domain and create the profile.
-- Sign-up is rejected if the domain is not a known campus domain.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_domain    text := lower(split_part(new.email, '@', 2));
  v_campus_id uuid;
begin
  select campus_id into v_campus_id from campus_domains where domain = v_domain;
  if v_campus_id is null then
    raise exception 'Email domain % is not an enrolled campus', v_domain;
  end if;

  insert into profiles (id, campus_id, name, email)
  values (
    new.id,
    v_campus_id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security — the campus wall
-- ─────────────────────────────────────────────────────────────────────────────
alter table profiles       enable row level security;
alter table meetup_spots   enable row level security;
alter table listings       enable row level security;
alter table wanted_posts   enable row level security;
alter table threads        enable row level security;
alter table messages       enable row level security;
alter table saved_searches enable row level security;

-- Profiles: everyone on your campus is visible; you may edit only your own.
create policy profiles_read on profiles
  for select using (campus_id = current_campus());
create policy profiles_update_self on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Meetup spots: read within your campus; anyone on-campus may add one.
create policy spots_read on meetup_spots
  for select using (campus_id = current_campus());
create policy spots_insert on meetup_spots
  for insert with check (campus_id = current_campus());
create policy spots_update on meetup_spots
  for update using (campus_id = current_campus()) with check (campus_id = current_campus());

-- Listings: the board shows active listings on your campus. Owners always see
-- their own (any status). Create/update only your own.
create policy listings_read on listings
  for select using (
    campus_id = current_campus() and (status = 'active' or seller_id = auth.uid())
  );
create policy listings_insert on listings
  for insert with check (campus_id = current_campus() and seller_id = auth.uid());
create policy listings_update_own on listings
  for update using (seller_id = auth.uid()) with check (seller_id = auth.uid());

-- Wanted posts: read within campus, author owns writes.
create policy wanted_read on wanted_posts
  for select using (campus_id = current_campus());
create policy wanted_insert on wanted_posts
  for insert with check (campus_id = current_campus() and author_id = auth.uid());
create policy wanted_delete_own on wanted_posts
  for delete using (author_id = auth.uid());

-- Threads: only the two participants can see or touch a thread.
create policy threads_read on threads
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy threads_insert on threads
  for insert with check (campus_id = current_campus() and buyer_id = auth.uid());
create policy threads_update_participant on threads
  for update using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Messages: only participants of the parent thread; sender is yourself.
create policy messages_read on messages
  for select using (
    exists (
      select 1 from threads t
      where t.id = messages.thread_id
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );
create policy messages_insert on messages
  for insert with check (
    sender_id = auth.uid() and exists (
      select 1 from threads t
      where t.id = messages.thread_id
        and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())
    )
  );

-- Saved searches: private to the user.
create policy saved_read on saved_searches
  for select using (user_id = auth.uid());
create policy saved_write on saved_searches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
