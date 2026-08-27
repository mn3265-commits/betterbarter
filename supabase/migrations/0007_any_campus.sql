-- Any campus, not one campus.
--
-- Until now a school had to be enrolled by hand before anyone from it could
-- sign up, and everyone else was turned away at the door. That was right while
-- there was one board; it is wrong as a product. A university email is already
-- proof of a campus — so the first person to arrive from a new school creates
-- that school's board by signing in, and it is theirs alone from that moment.
--
-- What does NOT change: the campus wall. Every board is still isolated by
-- row-level security, and an address that is not an academic domain still
-- cannot get in.

alter table campuses
  add column if not exists logo_url       text,
  add column if not exists website        text,
  add column if not exists is_placeholder boolean not null default false;

comment on column campuses.is_placeholder is
  'True while the name was derived from the email domain rather than looked up. The first client with the registry loaded fills it in.';

-- Which domains count as a campus at all. Deliberately narrow: an academic
-- namespace, not any address that happens to belong to a student.
create or replace function is_academic_domain(v_domain text) returns boolean
  language sql immutable as $$
  select v_domain like '%.edu'
      or v_domain like '%.edu.%'
      or v_domain like '%.ac.%'
      or v_domain like '%.ac'
$$;

-- "columbia.edu" -> "Columbia", "ui.ac.id" -> "Ui". A placeholder with the
-- right shape, replaced by the real name as soon as a client can look it up.
create or replace function campus_name_from_domain(v_domain text) returns text
  language sql immutable as $$
  select initcap(replace(split_part(v_domain, '.', 1), '-', ' '))
$$;

create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare
  v_domain    text := lower(split_part(new.email, '@', 2));
  v_campus_id uuid;
  v_slug      text;
begin
  select campus_id into v_campus_id from campus_domains where domain = v_domain;

  if v_campus_id is null then
    if not is_academic_domain(v_domain) then
      raise exception 'Email domain % is not a university address', v_domain;
    end if;

    -- First person here from this school: their sign-up opens the board.
    v_slug := regexp_replace(v_domain, '[^a-z0-9]+', '-', 'g');
    insert into campuses (name, slug, website, logo_url, is_placeholder)
    values (
      campus_name_from_domain(v_domain),
      v_slug,
      'https://' || v_domain,
      'https://www.google.com/s2/favicons?domain=' || v_domain || '&sz=128',
      true
    )
    returning id into v_campus_id;

    insert into campus_domains (domain, campus_id) values (v_domain, v_campus_id);
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

-- The client ships the domain->name registry, so it can finish the job the
-- trigger could only start. Only a placeholder name is ever overwritten, and
-- only by someone who belongs to that campus.
create or replace function name_my_campus(p_name text) returns boolean
  language plpgsql security definer set search_path = public as $$
declare
  v_campus uuid := current_campus();
  v_clean  text := nullif(btrim(p_name), '');
begin
  if v_campus is null or v_clean is null or length(v_clean) > 120 then
    return false;
  end if;
  update campuses
     set name = v_clean, is_placeholder = false
   where id = v_campus and is_placeholder;
  return found;
end;
$$;

revoke execute on function name_my_campus(text) from public;
grant  execute on function name_my_campus(text) to authenticated;
revoke execute on function is_academic_domain(text) from public;
revoke execute on function campus_name_from_domain(text) from public;

-- The board header and the profile read their own campus row, which already
-- has a select policy scoped to the viewer's campus (0002).
