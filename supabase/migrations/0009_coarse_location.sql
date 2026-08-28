-- Coarse location, and only coarse.
--
-- Two people on the same campus still need to know whether something is a
-- two-minute walk or across the whole site. What they must never learn is where
-- the other person actually is: this stores a point rounded to three decimal
-- places (~100 m), and no client is ever allowed to read anyone else's.
-- Distance is computed inside the database and returned as a rounded number.

alter table profiles
  add column if not exists approx_lat numeric(8,3),
  add column if not exists approx_lng numeric(8,3);

alter table listings
  add column if not exists approx_lat numeric(8,3),
  add column if not exists approx_lng numeric(8,3);

comment on column profiles.approx_lat is
  'Latitude rounded to ~100 m. Never returned to other users; only used to compute a distance band.';

create or replace function set_my_location(p_lat double precision, p_lng double precision)
  returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  if p_lat is null or p_lng is null or p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    return false;
  end if;
  update profiles
     set approx_lat = round(p_lat::numeric, 3),
         approx_lng = round(p_lng::numeric, 3)
   where id = auth.uid();
  return true;
end;
$$;

create or replace function clear_my_location() returns boolean
  language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return false; end if;
  update profiles set approx_lat = null, approx_lng = null where id = auth.uid();
  return true;
end;
$$;

-- Distance from the caller to each active listing on their own campus, in
-- kilometres rounded to one decimal. Returns ids and distances only — never a
-- coordinate — and nothing at all when either side has no location.
create or replace function listing_distances()
  returns table (listing_id uuid, km numeric)
  language sql stable security definer set search_path = public as $$
  with me as (
    select approx_lat as lat, approx_lng as lng, campus_id
      from profiles where id = auth.uid()
  )
  select l.id,
         round(
           (6371 * acos(
             least(1, greatest(-1,
               cos(radians(me.lat)) * cos(radians(l.approx_lat)) *
               cos(radians(l.approx_lng) - radians(me.lng)) +
               sin(radians(me.lat)) * sin(radians(l.approx_lat))
             ))
           ))::numeric, 1)
    from listings l, me
   where l.campus_id = me.campus_id
     and me.lat is not null
     and l.approx_lat is not null;
$$;

revoke execute on function set_my_location(double precision, double precision) from public;
revoke execute on function clear_my_location() from public;
revoke execute on function listing_distances() from public;
grant execute on function set_my_location(double precision, double precision) to authenticated;
grant execute on function clear_my_location() to authenticated;
grant execute on function listing_distances() to authenticated;
