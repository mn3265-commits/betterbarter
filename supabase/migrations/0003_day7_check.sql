-- The day-7 freshness check, as a function the database can run on a schedule.
--
-- Rule from the spec: at 7 days a listing needs a decision from its owner.
-- No answer within 48 hours (i.e. by day 9) and it pauses itself, so the board
-- can never fill with things that are already gone. Pausing is reversible —
-- the owner sees it under "Paused" and can relist in one tap.
--
-- `confirmed_at` is the freshness clock: "Still here", "Make it free" and
-- "Relist" all stamp it, which restarts the seven days.

create or replace function run_day7_check() returns integer
  language plpgsql security definer set search_path = public as $$
declare
  prompted integer := 0;
  paused   integer := 0;
begin
  -- Day 7: mark that the owner has been asked.
  update listings
     set day7_prompt_at = now()
   where status = 'active'
     and day7_prompt_at is null
     and coalesce(confirmed_at, created_at) < now() - interval '7 days';
  get diagnostics prompted = row_count;

  -- 48 hours later with no answer: pause it.
  update listings
     set status = 'paused'
   where status = 'active'
     and day7_prompt_at is not null
     and day7_prompt_at < now() - interval '48 hours'
     and coalesce(confirmed_at, created_at) < now() - interval '7 days';
  get diagnostics paused = row_count;

  -- Answering the check clears the prompt so the next cycle can arm again.
  update listings
     set day7_prompt_at = null
   where day7_prompt_at is not null
     and confirmed_at is not null
     and confirmed_at > day7_prompt_at;

  return prompted + paused;
end;
$$;

-- Not callable from the browser: this is a maintenance job, not an API.
revoke execute on function run_day7_check() from public;

-- Schedule it hourly. pg_cron must be enabled first (Supabase dashboard →
-- Database → Extensions → pg_cron). Safe to re-run: unschedule then schedule.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('handoff-day7')
      where exists (select 1 from cron.job where jobname = 'handoff-day7');
    perform cron.schedule('handoff-day7', '7 * * * *', 'select run_day7_check()');
  else
    raise notice 'pg_cron is not enabled — enable it and re-run this block to schedule the day-7 check.';
  end if;
end
$$;
