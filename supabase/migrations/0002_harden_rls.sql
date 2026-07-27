-- Close the gaps the security advisor flagged after 0001_init.sql.

-- 1. Enable RLS on the two lookup tables (they are exposed to PostgREST).
alter table campuses       enable row level security;
alter table campus_domains enable row level security;

-- Authenticated users may read only their own campus row (for the board header).
create policy campuses_read on campuses
  for select to authenticated using (id = current_campus());

-- campus_domains gets RLS with NO policy: it is read only by the
-- SECURITY DEFINER signup trigger (which runs as owner and bypasses RLS).
-- No client role can read the domain->campus map.

-- 2. Take the helper functions off the public RPC surface.
--    current_campus() must stay executable by `authenticated` (RLS policies call
--    it); revoke from PUBLIC/anon and grant back to authenticated only.
revoke execute on function current_campus() from public;
grant  execute on function current_campus() to authenticated;

--    handle_new_user() is a trigger function; triggers fire as the table owner
--    regardless of EXECUTE grants, so it needs no client-callable grant at all.
revoke execute on function handle_new_user() from public;
