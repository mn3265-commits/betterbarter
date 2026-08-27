-- Four ways an object can move, not two.
--
-- The board started as give-away plus resale, and deliberately cut trade and
-- rent as "a second app hiding inside the first". Under a circular-economy
-- framing that call inverts: a swap keeps two objects in use instead of one,
-- and a loan is the only way one drill serves a whole floor. What stays cut is
-- the part that made them dangerous — deposits, escrow, damage adjudication.
-- Handoff still never holds money or arbitrates; a rental is two students and a
-- promise, exactly like every other handoff on this board.
--
-- Note the deliberate asymmetry in the impact model (src/lib/impact.ts): a
-- rental is counted as a reuse event but earns no avoided-production credit,
-- because the object comes back.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'listing_kind') then
    create type listing_kind as enum ('free', 'sale', 'trade', 'rent');
  end if;
end $$;

alter table listings
  add column if not exists kind        listing_kind not null default 'free',
  add column if not exists trade_for   text,      -- what the owner wants instead
  add column if not exists rent_rate   integer,   -- price per period
  add column if not exists rent_period text;      -- 'day' | 'week' | 'month' | 'term'

-- Existing rows predate the column: derive the kind they already had.
update listings set kind = (case when is_free then 'free' else 'sale' end)::listing_kind
 where kind = 'free' and not is_free;

-- The old constraint (price is null exactly when free) cannot describe a swap
-- with no price or a rental with a rate. Replace it with one per kind.
alter table listings drop constraint if exists price_matches_free;
alter table listings drop constraint if exists price_matches_kind;
alter table listings add constraint price_matches_kind check (
  (kind = 'free'  and is_free       and price is null and rent_rate is null)
  or (kind = 'sale'  and not is_free and price is not null and rent_rate is null)
  or (kind = 'trade' and price is null and rent_rate is null)
  or (kind = 'rent'  and price is null and rent_rate is not null)
);

comment on column listings.kind is
  'How the object moves: free | sale | trade | rent. Only the first three transfer ownership, which is why rent earns no carbon credit.';

create index if not exists listings_kind_idx on listings (campus_id, kind, status, created_at desc);
