-- The revoke in 0025 did nothing, and the test caught it.
--
-- `revoke select (handoff_code) on threads from authenticated` looks like it
-- removes access to one column. It does not, when the role already holds a
-- table-wide `GRANT SELECT` — a whole-table grant covers every column,
-- including ones added later, and a column-level revoke cannot carve a hole in
-- it. Both parties could still read all six digits straight off their own
-- thread row, which is the entire thing this was supposed to prevent.
--
-- The fix is to stop granting the table and start granting the columns. Any
-- column added to `threads` from here is invisible to clients until it is named
-- below, which is the safer default for a table that now holds a secret.

revoke select on threads from anon, authenticated;

grant select (
  id, campus_id, listing_id, buyer_id, seller_id, spot_name, pickup_window,
  hold_expires_at, buyer_done, seller_done, created_at, completed_at,
  helper_id, code_attempts, code_verified_at
) on threads to authenticated;

grant insert, update on threads to authenticated;
