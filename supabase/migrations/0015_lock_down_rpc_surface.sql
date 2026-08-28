-- Close the outer door on every RPC.
--
-- Each of these functions already checks auth.uid() and refuses a stranger, so
-- nothing was leaking — but `revoke ... from public` never removed anonymous
-- access, because Supabase grants EXECUTE to `anon` and `authenticated`
-- directly rather than through PUBLIC. Every function was therefore callable
-- without signing in, and the only thing standing between an anonymous caller
-- and cross-campus aggregates was one `if` inside founder_metrics().
--
-- Defence in depth means both: the check inside, and no grant outside.

-- Internal helpers: nobody calls these from a client.
alter function is_academic_domain(text) set search_path = public;
alter function campus_name_from_domain(text) set search_path = public;
revoke all on function is_academic_domain(text) from public, anon, authenticated;
revoke all on function campus_name_from_domain(text) from public, anon, authenticated;

-- A trigger function is not an endpoint.
revoke all on function handle_new_user() from public, anon, authenticated;

-- Signed-in only, every one of them.
revoke execute on function current_campus() from public, anon;
grant  execute on function current_campus() to authenticated;

revoke execute on function set_handoff_done(uuid, boolean) from public, anon;
grant  execute on function set_handoff_done(uuid, boolean) to authenticated;

revoke execute on function name_my_campus(text) from public, anon;
grant  execute on function name_my_campus(text) to authenticated;

revoke execute on function set_my_location(double precision, double precision) from public, anon;
grant  execute on function set_my_location(double precision, double precision) to authenticated;

revoke execute on function clear_my_location() from public, anon;
grant  execute on function clear_my_location() to authenticated;

revoke execute on function listing_distances() from public, anon;
grant  execute on function listing_distances() to authenticated;

revoke execute on function rating_summary(uuid) from public, anon;
grant  execute on function rating_summary(uuid) to authenticated;

revoke execute on function accept_carry(uuid) from public, anon;
grant  execute on function accept_carry(uuid) to authenticated;

revoke execute on function founder_metrics() from public, anon;
grant  execute on function founder_metrics() to authenticated;

-- And stop the next function from inheriting a grant nobody asked for.
alter default privileges in schema public revoke execute on functions from public, anon;
