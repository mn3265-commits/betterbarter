-- Two tiers of evidence, reported apart.
--
-- A handoff confirmed by joining two halves of a code happened in person: the
-- six digits did not exist in one place until two people were standing
-- together. A handoff confirmed by two taps might have happened, and probably
-- did, but nothing about it is proof.
--
-- Kept as its own function rather than folded into founder_metrics(), because
-- this is the number that will be asked about on a stage and it should be
-- possible to read it without reading anything else.
create or replace function handoff_integrity() returns json
  language plpgsql stable security definer set search_path = public as $$
declare v_ok boolean;
begin
  select coalesce(is_founder, false) into v_ok from profiles where id = auth.uid();
  if not coalesce(v_ok, false) then raise exception 'Not a founder account'; end if;

  return json_build_object(
    'handoffs',   (select count(*) from threads where completed_at is not null),
    'verified',   (select count(*) from threads where code_verified_at is not null),
    'onTrust',    (select count(*) from threads where completed_at is not null and code_verified_at is null),
    'openCodes',  (select count(*) from threads where completed_at is null and handoff_code is not null),
    'badTries',   (select coalesce(sum(code_attempts), 0) from threads),
    'lockedOut',  (select count(*) from threads where code_attempts >= 5 and completed_at is null)
  );
end;
$$;

revoke execute on function handoff_integrity() from public, anon;
grant  execute on function handoff_integrity() to authenticated;
