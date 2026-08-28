-- The moderation queue the founders actually work from.
--
-- This is the one place a founder sees a name rather than a count, because a
-- report cannot be actioned against an anonymous number. It returns only what
-- is needed to make that decision: who was reported, by whom, why, and whether
-- the account has been reported before. It is a separate function from
-- founder_metrics() so the aggregate view stays anonymous.

create or replace function moderation_queue()
  returns json
  language plpgsql stable security definer set search_path = public as $$
declare
  v_ok boolean;
begin
  select coalesce(is_founder, false) into v_ok from profiles where id = auth.uid();
  if not coalesce(v_ok, false) then
    raise exception 'Not a founder account';
  end if;

  return coalesce((
    select json_agg(row_to_json(r) order by r.created_at desc)
      from (
        select rp.id,
               rp.reason,
               rp.note,
               rp.status,
               rp.created_at,
               subject.name  as subject_name,
               subject.email as subject_email,
               reporter.name as reporter_name,
               c.name        as campus,
               (select count(*) from reports x where x.subject_id = rp.subject_id) as times_reported,
               (select count(*) from listings l where l.seller_id = rp.subject_id) as subject_listings
          from reports rp
          join profiles subject  on subject.id  = rp.subject_id
          join profiles reporter on reporter.id = rp.reporter_id
          join campuses c        on c.id        = subject.campus_id
         order by rp.created_at desc
         limit 100
      ) r
  ), '[]'::json);
end;
$$;

create or replace function set_report_status(p_report uuid, p_status text)
  returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_ok boolean;
begin
  select coalesce(is_founder, false) into v_ok from profiles where id = auth.uid();
  if not coalesce(v_ok, false) then return false; end if;
  if p_status not in ('open','reviewed','actioned','dismissed') then return false; end if;
  update reports set status = p_status where id = p_report;
  return found;
end;
$$;

revoke execute on function moderation_queue() from public, anon;
grant  execute on function moderation_queue() to authenticated;
revoke execute on function set_report_status(uuid, text) from public, anon;
grant  execute on function set_report_status(uuid, text) to authenticated;

-- Report counts belong on the founders' dashboard too.
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
