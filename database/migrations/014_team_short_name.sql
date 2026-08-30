-- ---------------------------------------------------------------------------
-- Short club names for tables
--
-- Set only where the full name is too long to sit in a results row. Fall 2026
-- has exactly one: "Central Sporting Club Of PURO" becomes "CSCP". The other
-- seven keep their "S.C <city>" names, which already fit, so their column
-- stays NULL and the reader falls back to `name`.
--
-- Nullable rather than defaulted for that reason: NULL means "the full name is
-- fine here", which is the common case and reads correctly without anyone
-- having to duplicate every club name into a second column.
-- ---------------------------------------------------------------------------

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS short_name VARCHAR(40);

COMMENT ON COLUMN teams.short_name IS
  'Name used in tables and fixtures where the full name will not fit, e.g. "CSCP". NULL means use name.';

UPDATE teams SET short_name = 'CSCP' WHERE slug = 'cscp';
