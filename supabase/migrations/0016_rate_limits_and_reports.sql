-- Two things a housing office will ask about before they put their name on this.

-- ── 1. Rate limits ───────────────────────────────────────────────────────────
-- Enforced in the database, because that is the only place a client cannot talk
-- its way around. The numbers are set well above what a real student does in a
-- day and well below what a script does in a minute.
--
-- (0018 corrects two things in this body — the message, and which account gets
-- counted. It is left as written here so the history reads true.)

create or replace function enforce_rate_limit() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_recent  integer;
  v_window  interval;
  v_max     integer;
  v_what    text;
begin
  case tg_table_name
    when 'listings'     then v_window := interval '1 hour';   v_max := 15;  v_what := 'listings';
    when 'messages'     then v_window := interval '1 minute'; v_max := 20;  v_what := 'messages';
    when 'wanted_posts' then v_window := interval '1 hour';   v_max := 10;  v_what := 'wanted posts';
    when 'carry_offers' then v_window := interval '1 hour';   v_max := 20;  v_what := 'carry offers';
    when 'reports'      then v_window := interval '1 hour';   v_max := 10;  v_what := 'reports';
    else return new;
  end case;

  execute format(
    'select count(*) from %I where %I = $1 and created_at > now() - $2',
    tg_table_name,
    case tg_table_name
      when 'listings' then 'seller_id'
      when 'messages' then 'sender_id'
      when 'wanted_posts' then 'author_id'
      when 'carry_offers' then 'helper_id'
      else 'reporter_id'
    end
  ) into v_recent using auth.uid(), v_window;

  if v_recent >= v_max then
    raise exception 'Slow down — % % in the last %. Try again shortly.', v_recent, v_what, v_window
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

revoke all on function enforce_rate_limit() from public, anon, authenticated;

drop trigger if exists rate_limit_listings on listings;
create trigger rate_limit_listings before insert on listings
  for each row execute function enforce_rate_limit();

drop trigger if exists rate_limit_messages on messages;
create trigger rate_limit_messages before insert on messages
  for each row execute function enforce_rate_limit();

drop trigger if exists rate_limit_wanted on wanted_posts;
create trigger rate_limit_wanted before insert on wanted_posts
  for each row execute function enforce_rate_limit();

drop trigger if exists rate_limit_carry on carry_offers;
create trigger rate_limit_carry before insert on carry_offers
  for each row execute function enforce_rate_limit();

-- ── 2. Reports, and the block that goes with them ────────────────────────────
-- The rules promise that reporting hides an account from you immediately and
-- flags it for review. Until now the button showed a toast and nothing else.

create table if not exists reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references profiles (id) on delete cascade,
  subject_id   uuid not null references profiles (id) on delete cascade,
  listing_id   uuid references listings (id) on delete set null,
  thread_id    uuid references threads (id) on delete set null,
  reason       text not null check (reason in ('not_as_described','never_showed','rule_break','harassment','unsafe','spam','other')),
  note         text,
  status       text not null default 'open' check (status in ('open','reviewed','actioned','dismissed')),
  created_at   timestamptz not null default now(),
  check (reporter_id <> subject_id)
);

create index if not exists reports_open_idx on reports (status, created_at desc);

create table if not exists blocks (
  blocker_id uuid not null references profiles (id) on delete cascade,
  blocked_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table reports enable row level security;
alter table blocks  enable row level security;

drop trigger if exists rate_limit_reports on reports;
create trigger rate_limit_reports before insert on reports
  for each row execute function enforce_rate_limit();

-- You may file a report and see your own. Founders read all of them, because
-- somebody has to action them.
drop policy if exists reports_insert_own on reports;
create policy reports_insert_own on reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists reports_read on reports;
create policy reports_read on reports
  for select using (
    reporter_id = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.is_founder)
  );

drop policy if exists reports_update_founder on reports;
create policy reports_update_founder on reports
  for update using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_founder));

-- A block is private to the person who made it.
drop policy if exists blocks_own on blocks;
create policy blocks_own on blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Reporting someone blocks them, in one step, from the person's point of view.
create or replace function report_account(
  p_subject uuid,
  p_reason  text,
  p_note    text default null,
  p_listing uuid default null,
  p_thread  uuid default null
) returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_subject = auth.uid() then return false; end if;

  insert into reports (reporter_id, subject_id, listing_id, thread_id, reason, note)
  values (auth.uid(), p_subject, p_listing, p_thread, p_reason, nullif(btrim(p_note), ''));

  insert into blocks (blocker_id, blocked_id)
  values (auth.uid(), p_subject)
  on conflict do nothing;

  return true;
end;
$$;

revoke execute on function report_account(uuid, text, text, uuid, uuid) from public, anon;
grant  execute on function report_account(uuid, text, text, uuid, uuid) to authenticated;

-- The board stops showing a blocked account's listings, in the database rather
-- than in the client.
drop policy if exists listings_read on listings;
create policy listings_read on listings
  for select using (
    campus_id = current_campus()
    and (status = 'active' or seller_id = auth.uid())
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
  );
