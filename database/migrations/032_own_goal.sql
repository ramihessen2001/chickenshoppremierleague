-- ---------------------------------------------------------------------------
-- Own goals
--
-- An own goal is recorded against the player who scored it, under their own
-- club (team_id is the player's team, as for every statistic), and counts
-- towards the OPPONENT's score. It is never one of the player's goals: stat
-- leaders, player totals and the graphics count only 'goal'.
--
-- The stat type list is a CHECK constraint, so it is replaced with one that
-- includes 'own_goal'. The name is Postgres's default for the inline check in
-- database/schema.sql.
-- ---------------------------------------------------------------------------

ALTER TABLE game_statistics DROP CONSTRAINT IF EXISTS game_statistics_stat_type_check;
ALTER TABLE game_statistics
  ADD CONSTRAINT game_statistics_stat_type_check
  CHECK (stat_type IN ('goal', 'own_goal', 'assist', 'save', 'yellow_card', 'red_card', 'blue_card'));
