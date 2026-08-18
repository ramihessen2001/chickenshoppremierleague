-- Season archive: a full, standalone copy of a season's rosters, games,
-- stats and standings, so past seasons stay browsable after the live
-- tables are reset for the next one.
--
-- Deliberately a separate set of tables rather than a `season_id` on the
-- live ones -- every existing query keeps working unmodified against
-- "whatever is live right now", and the archive is just somewhere else
-- entirely, written once (by the "archive & reset season" admin action)
-- and read-only after that. Team identity (name/logo/colour) is snapshotted
-- into archive_teams too, so the archive still looks right even if a team
-- is later renamed or removed from the live `teams` table.

CREATE TABLE IF NOT EXISTS archive_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(100) NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS archive_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_season_id UUID NOT NULL REFERENCES archive_seasons(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7),
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS archive_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_season_id UUID NOT NULL REFERENCES archive_seasons(id) ON DELETE CASCADE,
  archive_team_id UUID REFERENCES archive_teams(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  jersey_number INTEGER,
  position VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS archive_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_season_id UUID NOT NULL REFERENCES archive_seasons(id) ON DELETE CASCADE,
  game_number INTEGER,
  week_number INTEGER,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(200),
  home_archive_team_id UUID REFERENCES archive_teams(id) ON DELETE SET NULL,
  away_archive_team_id UUID REFERENCES archive_teams(id) ON DELETE SET NULL,
  home_score INTEGER,
  away_score INTEGER,
  status VARCHAR(20),
  is_playoff BOOLEAN DEFAULT FALSE,
  playoff_round VARCHAR(50),
  player_of_game_archive_id UUID REFERENCES archive_players(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS archive_game_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_game_id UUID REFERENCES archive_games(id) ON DELETE CASCADE,
  archive_player_id UUID REFERENCES archive_players(id) ON DELETE SET NULL,
  archive_team_id UUID REFERENCES archive_teams(id) ON DELETE SET NULL,
  stat_type VARCHAR(20) NOT NULL,
  count INTEGER DEFAULT 1,
  timestamp VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS archive_standings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_season_id UUID NOT NULL REFERENCES archive_seasons(id) ON DELETE CASCADE,
  archive_team_id UUID REFERENCES archive_teams(id) ON DELETE SET NULL,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_archive_teams_season ON archive_teams(archive_season_id);
CREATE INDEX IF NOT EXISTS idx_archive_players_season ON archive_players(archive_season_id);
CREATE INDEX IF NOT EXISTS idx_archive_players_team ON archive_players(archive_team_id);
CREATE INDEX IF NOT EXISTS idx_archive_games_season ON archive_games(archive_season_id);
CREATE INDEX IF NOT EXISTS idx_archive_game_stats_game ON archive_game_statistics(archive_game_id);
CREATE INDEX IF NOT EXISTS idx_archive_standings_season ON archive_standings(archive_season_id);

ALTER TABLE archive_seasons        ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_players        ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_games          ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_standings      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read" ON archive_seasons;
DROP POLICY IF EXISTS "public read" ON archive_teams;
DROP POLICY IF EXISTS "public read" ON archive_players;
DROP POLICY IF EXISTS "public read" ON archive_games;
DROP POLICY IF EXISTS "public read" ON archive_game_statistics;
DROP POLICY IF EXISTS "public read" ON archive_standings;

CREATE POLICY "public read" ON archive_seasons        FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_teams          FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_players        FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_games          FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_game_statistics FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_standings      FOR SELECT USING (true);
