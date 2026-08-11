-- Solution: Make away_team_id nullable for playoff games with TBD opponents
-- OR use a workaround by initially setting a placeholder team

-- Option 1: Make away_team_id nullable (recommended for flexibility)
ALTER TABLE games
ALTER COLUMN away_team_id DROP NOT NULL;

-- Now you can insert playoff games with NULL away_team_id for TBD matchups
-- After this, run the insert_playoff_games.sql again


