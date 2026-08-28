-- The day-7 check had never run. Not once, since the day it was written: the
-- extension it needs was never installed, and the scheduling block in 0003
-- quietly raised a notice and moved on. Every "the board stays fresh by itself"
-- claim had been describing a function nobody was calling.
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('handoff-day7')      where exists (select 1 from cron.job where jobname = 'handoff-day7');
  perform cron.unschedule('betterbarter-life') where exists (select 1 from cron.job where jobname = 'betterbarter-life');
  perform cron.schedule('betterbarter-life', '7 * * * *', 'select run_lifecycle()');
end
$$;
