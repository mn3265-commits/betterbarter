-- Two corrections to the rate limiter, both found by running it.
--
-- 1. The message said "in the last 01:00:00". Postgres renders an interval that
--    way; a person does not read it that way. The limit is a piece of writing
--    the only people who ever see it are being told no by — so it says "hour".
--
-- 2. It counted by auth.uid() rather than by the actor on the row being written.
--    Those are the same person on every path that exists today, but the moment a
--    SECURITY DEFINER function writes a row on someone's behalf the count is
--    taken against the wrong account — and, if there is no JWT at all, against
--    nobody, which passes. Count the actor named on the row.

create or replace function enforce_rate_limit() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_recent integer;
  v_window interval;
  v_max    integer;
  v_what   text;
  v_says   text;   -- the window in words
  v_col    text;
  v_actor  uuid;
begin
  case tg_table_name
    when 'listings'     then v_window := interval '1 hour';   v_max := 15; v_what := 'listings';      v_says := 'hour';   v_col := 'seller_id';
    when 'messages'     then v_window := interval '1 minute'; v_max := 20; v_what := 'messages';      v_says := 'minute'; v_col := 'sender_id';
    when 'wanted_posts' then v_window := interval '1 hour';   v_max := 10; v_what := 'posts';         v_says := 'hour';   v_col := 'author_id';
    when 'carry_offers' then v_window := interval '1 hour';   v_max := 20; v_what := 'carry offers';  v_says := 'hour';   v_col := 'helper_id';
    when 'reports'      then v_window := interval '1 hour';   v_max := 10; v_what := 'reports';       v_says := 'hour';   v_col := 'reporter_id';
    else return new;
  end case;

  execute format('select ($1).%I', v_col) into v_actor using new;
  v_actor := coalesce(v_actor, auth.uid());
  if v_actor is null then return new; end if;

  execute format('select count(*) from %I where %I = $1 and created_at > now() - $2', tg_table_name, v_col)
    into v_recent using v_actor, v_window;

  if v_recent >= v_max then
    raise exception 'That is % % in the last %. Give it a few minutes.', v_recent, v_what, v_says
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
