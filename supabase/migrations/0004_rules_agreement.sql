-- Record that an account agreed to the community rules.
--
-- This is evidence, not a preference: it says which version of the rules the
-- person accepted and when. Bumping RULES_VERSION in src/lib/rules.ts re-asks
-- everyone, which is what you want when the rules materially change.

alter table profiles
  add column if not exists rules_accepted_at timestamptz,
  add column if not exists rules_version     integer not null default 0;

-- Existing accounts predate the agreement, so they are asked on next open.
comment on column profiles.rules_accepted_at is
  'When this account last agreed to the community rules (null = never).';
comment on column profiles.rules_version is
  'Which rules version was agreed to; compared against RULES_VERSION in the app.';
