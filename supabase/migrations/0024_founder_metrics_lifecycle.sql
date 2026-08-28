-- The founders should be able to see the staircase working, or not working.
-- Still aggregates only — the moderation queue in 0017 remains the one function
-- that returns a name.
create or replace function founder_metrics()
  returns json
  language plpgsql stable security definer set search_path = public as $$
declare
  v_ok boolean;
begin
  select coalesce(is_founder, false) into v_ok from profiles where id = auth.uid();
  if not coalesce(v_ok, false) then
    raise exception 'Not a founder account';
  end if;

  return json_build_object(
    'accounts',      (select count(*) from profiles),
    'campuses',      (select count(*) from campuses),
    'listings',      (select count(*) from listings),
    'listingsLive',  (select count(*) from listings where status = 'active'),
    'listingsGone',  (select count(*) from listings where status = 'gone'),
    'listingsPaused',   (select count(*) from listings where status = 'paused'),
    'listingsArchived', (select count(*) from listings where status = 'archived'),
    'deactivated',   (select count(*) from profiles where deactivated_at is not null),
    -- Shown, never acted on. See the note in 0020 about why this is not a timer.
    'dormant90',     (select count(*) from profiles
                       where deactivated_at is null
                         and coalesce(last_seen_at, joined_at) < now() - interval '90 days'),
    'photosQueued',  (select count(*) from storage_reclaim where deleted_at is null),
    'threads',       (select count(*) from threads),
    'handoffs',      (select count(*) from threads where completed_at is not null),
    'carries',       (select coalesce(sum(carries), 0) from profiles),
    'carryOffers',   (select count(*) from carry_offers),
    'wanted',        (select count(*) from wanted_posts),
    'messages',      (select count(*) from messages),
    'ratingAvg',     (select round(avg(stars)::numeric, 2) from ratings),
    'ratingCount',   (select count(*) from ratings),
    'photos',        (select count(*) from listings where photo_path is not null),
    'withLocation',  (select count(*) from profiles where approx_lat is not null),
    'reportsOpen',   (select count(*) from reports where status = 'open'),
    'reportsTotal',  (select count(*) from reports),
    'blocks',        (select count(*) from blocks),

    'byKind', coalesce((
      select json_object_agg(kind, n) from (
        select kind::text as kind, count(*) n from listings group by kind
      ) k), '{}'::json),

    'byCategory', coalesce((
      select json_object_agg(category, n) from (
        select category, count(*) n from listings group by category order by count(*) desc
      ) c), '{}'::json),

    'byCampus', coalesce((
      select json_agg(row_to_json(x)) from (
        select c.name,
               (select count(*) from profiles p where p.campus_id = c.id) as accounts,
               (select count(*) from listings l where l.campus_id = c.id) as listings,
               (select count(*) from threads t where t.campus_id = c.id and t.completed_at is not null) as handoffs
          from campuses c order by 2 desc
      ) x), '[]'::json),

    'daily', coalesce((
      select json_agg(row_to_json(d) order by d.day) from (
        select to_char(g.day, 'YYYY-MM-DD') as day,
               (select count(*) from profiles p where p.joined_at::date = g.day) as signups,
               (select count(*) from listings l where l.created_at::date = g.day) as listings,
               (select count(*) from threads t where t.completed_at::date = g.day) as handoffs
          from generate_series(current_date - interval '13 days', current_date, interval '1 day') as g(day)
      ) d), '[]'::json)
  );
end;
$$;

revoke execute on function founder_metrics() from public, anon;
grant  execute on function founder_metrics() to authenticated;
