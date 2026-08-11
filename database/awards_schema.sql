-- Awards Voting System Schema
-- This script creates tables for managing awards, nominees, and votes

-- Awards table - stores different award types (MVP, Golden Boot, etc.)
CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  season VARCHAR(100) NOT NULL, -- e.g., '2025 Winter'
  is_active BOOLEAN DEFAULT TRUE, -- Only active awards can receive votes
  voting_start_date TIMESTAMPTZ,
  voting_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Award nominees table - links players to awards
CREATE TABLE award_nominees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(award_id, player_id) -- A player can only be nominated once per award
);

-- Award votes table - tracks user votes
CREATE TABLE award_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES award_nominees(id) ON DELETE CASCADE,
  voter_identifier VARCHAR(255) NOT NULL, -- IP address or session ID to prevent duplicate votes
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(award_id, voter_identifier) -- One vote per award per user
);

-- Create indexes for better query performance
CREATE INDEX idx_awards_season ON awards(season);
CREATE INDEX idx_awards_active ON awards(is_active);
CREATE INDEX idx_award_nominees_award ON award_nominees(award_id);
CREATE INDEX idx_award_nominees_player ON award_nominees(player_id);
CREATE INDEX idx_award_votes_award ON award_votes(award_id);
CREATE INDEX idx_award_votes_nominee ON award_votes(nominee_id);
CREATE INDEX idx_award_votes_voter ON award_votes(voter_identifier);

-- Apply updated_at trigger to awards table
CREATE TRIGGER update_awards_updated_at BEFORE UPDATE ON awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_votes ENABLE ROW LEVEL SECURITY;

-- Public read access for awards and nominees (everyone can view)
CREATE POLICY "Allow public read access" ON awards FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON award_nominees FOR SELECT USING (true);

-- Public can insert votes (for voting)
CREATE POLICY "Allow public insert votes" ON award_votes FOR INSERT WITH CHECK (true);

-- Public can read their own votes (to check if they already voted)
CREATE POLICY "Allow public read votes" ON award_votes FOR SELECT USING (true);

-- Admin write access for awards and nominees (authenticated users only)
CREATE POLICY "Allow authenticated insert" ON awards FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON awards FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON awards FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON award_nominees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON award_nominees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete" ON award_nominees FOR DELETE TO authenticated USING (true);

-- Admin can manage votes (delete if needed)
CREATE POLICY "Allow authenticated delete" ON award_votes FOR DELETE TO authenticated USING (true);

COMMENT ON TABLE awards IS 'Awards for the league (MVP, Golden Boot, etc.)';
COMMENT ON TABLE award_nominees IS 'Players nominated for each award';
COMMENT ON TABLE award_votes IS 'User votes for award nominees';

