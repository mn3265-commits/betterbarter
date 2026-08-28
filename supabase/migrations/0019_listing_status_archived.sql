-- A fourth resting state for a listing, added on its own because Postgres will
-- not let a new enum value be used in the same transaction that creates it.
--
--   active   → on the board
--   paused   → off the board, one tap from being back (the owner's shelf)
--   gone     → handed to someone
--   archived → aged out. Still the owner's row, still in the impact ledger,
--              but off the shelf and with its photos released.
alter type listing_status add value if not exists 'archived';
