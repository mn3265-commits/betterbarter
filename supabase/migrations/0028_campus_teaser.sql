-- The one thing an anonymous caller may know.
--
-- Every other function here is closed to `anon` on purpose (0015), and that
-- stays true. This is a deliberate, narrow exception, and the reason is
-- orientation week: someone is handed a link, lands on a Google sign-in button,
-- and has no idea whether there is anything behind it. That is where an
-- invitation dies.
--
-- So this returns counts and a campus name. No rows, no titles, no people, no
-- prices — nothing that says who has what. A number is enough to be worth
-- signing in for, and a number cannot identify anybody.
--
-- The domain is optional and is only ever one the sharer already put in the
-- link themselves, so it reveals nothing they had not already revealed.
create or replace function campus_teaser(p_domain text default null)
  returns json
  language plpgsql stable security definer set search_path = public as $$
declare
  v_campus uuid;
  v_name   text;
begin
  if p_domain is not null then
    select cd.campus_id, c.name into v_campus, v_name
      from campus_domains cd join campuses c on c.id = cd.campus_id
     where cd.domain = lower(btrim(p_domain));
  end if;

  if v_campus is null then
    return json_build_object(
      'scope',    'all',
      'campus',   null,
      'live',     (select count(*) from listings l
                    join profiles p on p.id = l.seller_id
                   where l.status = 'active' and p.deactivated_at is null),
      'free',     (select count(*) from listings l
                    join profiles p on p.id = l.seller_id
                   where l.status = 'active' and l.is_free and p.deactivated_at is null),
      'campuses', (select count(*) from campuses));
  end if;

  return json_build_object(
    'scope',  'campus',
    'campus', v_name,
    'live',   (select count(*) from listings l
                join profiles p on p.id = l.seller_id
               where l.campus_id = v_campus and l.status = 'active' and p.deactivated_at is null),
    'free',   (select count(*) from listings l
                join profiles p on p.id = l.seller_id
               where l.campus_id = v_campus and l.status = 'active' and l.is_free and p.deactivated_at is null),
    'campuses', (select count(*) from campuses));
end;
$$;

grant execute on function campus_teaser(text) to anon, authenticated;

comment on function campus_teaser(text) is
  'The only function anon may call. Counts and a campus name, never rows. Exists so a shared link can say what is waiting instead of showing a bare sign-in wall.';
