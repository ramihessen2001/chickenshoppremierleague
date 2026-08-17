-- Standings become a real, admin-edited table instead of an uploaded image.
--
-- One row per team: games played, wins, draws, losses, goals for/against.
-- Goal difference and points are computed wherever the table is read, not
-- stored, so they can never drift out of sync with the columns here.

CREATE TABLE IF NOT EXISTS standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  wins        INTEGER NOT NULL DEFAULT 0 CHECK (wins >= 0),
  draws       INTEGER NOT NULL DEFAULT 0 CHECK (draws >= 0),
  losses      INTEGER NOT NULL DEFAULT 0 CHECK (losses >= 0),
  goals_for     INTEGER NOT NULL DEFAULT 0 CHECK (goals_for >= 0),
  goals_against INTEGER NOT NULL DEFAULT 0 CHECK (goals_against >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One row per existing team, all zeroes -- the admin fills these in from the
-- standings page as results come in.
INSERT INTO standings (team_id)
  SELECT id FROM teams
  ON CONFLICT (team_id) DO NOTHING;

DROP TRIGGER IF EXISTS update_standings_updated_at ON standings;
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE standings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public read" ON standings;
CREATE POLICY "public read" ON standings FOR SELECT USING (true);

-- The image-upload feature this replaces.
ALTER TABLE league_config DROP COLUMN IF EXISTS standings_image_url;
