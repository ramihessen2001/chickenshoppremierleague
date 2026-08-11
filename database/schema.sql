-- YM Soccer League Database Schema
-- This script creates all necessary tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE, -- URL-friendly version (e.g., 'eagles')
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  jersey_number INTEGER NOT NULL CHECK (jersey_number >= 0 AND jersey_number <= 999),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  position VARCHAR(50), -- Optional: 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, jersey_number) -- No duplicate jersey numbers per team
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_number INTEGER NOT NULL UNIQUE,
  week_number INTEGER,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(200) DEFAULT 'TBD',
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),
  home_score INTEGER CHECK (home_score >= 0),
  away_score INTEGER CHECK (away_score >= 0),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
  is_playoff BOOLEAN DEFAULT FALSE,
  playoff_round VARCHAR(50), -- 'play-in', 'semi-final', 'final'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (home_team_id != away_team_id) -- Team can't play itself
);

-- Game statistics table
CREATE TABLE game_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  stat_type VARCHAR(20) NOT NULL CHECK (stat_type IN ('goal', 'assist', 'save', 'yellow_card', 'red_card', 'blue_card')),
  count INTEGER DEFAULT 1 CHECK (count > 0), -- For goals, assists, saves
  timestamp VARCHAR(10), -- Optional: time in game (e.g., "23:45")
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- League configuration table
CREATE TABLE league_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_name VARCHAR(200) NOT NULL,
  season VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  current_week INTEGER DEFAULT 1,
  total_weeks INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_players_active ON players(is_active);
CREATE INDEX idx_games_date ON games(date);
CREATE INDEX idx_games_week ON games(week_number);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_game_stats_game ON game_statistics(game_id);
CREATE INDEX idx_game_stats_player ON game_statistics(player_id);
CREATE INDEX idx_game_stats_type ON game_statistics(stat_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_league_config_updated_at BEFORE UPDATE ON league_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_config ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (everyone can view)
CREATE POLICY "Allow public read access" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON game_statistics FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON league_config FOR SELECT USING (true);

-- Admin write access (authenticated users only)
-- Note: In production, you'd check for a specific admin role
-- For now, any authenticated user is considered admin
CREATE POLICY "Allow authenticated insert" ON teams FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON teams FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON teams FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON players FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON players FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON players FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON games FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON games FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON games FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON game_statistics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON game_statistics FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON game_statistics FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated update" ON league_config FOR UPDATE TO authenticated USING (true);

-- Insert initial league configuration
INSERT INTO league_config (league_name, season, start_date, end_date, current_week, total_weeks)
VALUES ('YM JAX SOCCER LEAGUE', '2025 Winter', '2025-12-25', '2026-01-10', 1, 5);

COMMENT ON TABLE teams IS 'Soccer teams in the league';
COMMENT ON TABLE players IS 'Players on team rosters';
COMMENT ON TABLE games IS 'Scheduled and completed games';
COMMENT ON TABLE game_statistics IS 'Box score statistics for games';
COMMENT ON TABLE league_config IS 'Global league configuration';

