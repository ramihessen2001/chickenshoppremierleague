-- Whether the homepage shows this week's fixtures / the stat leaders, moved
-- from a hardcoded config constant to the database so the schedule generator
-- (and the admin) can flip them at runtime instead of needing a code change.
--
-- Both default off: `games` and `game_statistics` have no season column, so
-- last season's rows are still sitting there until this season's schedule is
-- generated. Turning these on before then would show last year's fixtures
-- and stats as if they were this year's.

ALTER TABLE league_config
  ADD COLUMN IF NOT EXISTS show_home_fixtures BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE league_config
  ADD COLUMN IF NOT EXISTS show_home_stats BOOLEAN NOT NULL DEFAULT false;
