-- Where you meet, not where you sleep.
--
-- The residence-hall field was a mistake the first draft inherited from every
-- other campus marketplace: it asked a student to publish the building they live
-- in, to a stranger, as a convenience. What a handoff actually needs is a public
-- place both people are willing to stand in.

alter table profiles
  add column if not exists preferred_spot text;

comment on column profiles.preferred_spot is
  'Where this person prefers to hand things over — a public place on campus, not where they live. Replaces the residence-hall field as the default meetup spot.';

comment on column profiles.building is
  'Legacy: the hall someone lives in. No longer collected in the app; preferred_spot is what the product uses.';
