-- Migration to support playoff games in the games table
-- Playoff games will have week_number = 0 and game_number starting from 100

-- Add a column to identify playoff round (optional, for better organization)
ALTER TABLE games
ADD COLUMN IF NOT EXISTS playoff_round TEXT;

COMMENT ON COLUMN games.playoff_round IS 'Playoff round identifier: play-in, semifinal, final';

-- Create index for playoff games
CREATE INDEX IF NOT EXISTS idx_games_playoff ON games(week_number) WHERE week_number = 0;

-- Note: No changes needed to existing structure
-- Playoff games will use:
-- - week_number = 0 (to distinguish from regular season)
-- - game_number = 100+ (to avoid conflicts)
-- - playoff_round = 'play-in', 'semifinal', or 'final'


