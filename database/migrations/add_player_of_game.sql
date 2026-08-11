-- Add player_of_game_id column to games table
-- This will store the ID of the player selected as "Puro Player of the Game"

ALTER TABLE games
ADD COLUMN player_of_game_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_games_player_of_game ON games(player_of_game_id);

COMMENT ON COLUMN games.player_of_game_id IS 'ID of the player selected as Puro Player of the Game';


