-- ============================================================================
-- Chicken Shop Premier League - Database Schema
-- ============================================================================
-- Run this once against a fresh Supabase project (SQL Editor -> New Query).
-- It creates every table, index, trigger and policy the app needs.
--
-- SECURITY MODEL
-- --------------
-- The browser only ever holds the anon key, and the anon key can ONLY read.
-- Every write (admin edits, award votes, image uploads) goes through a Next.js
-- server route that uses the service role key, which bypasses RLS. That key is
-- never sent to the browser. Do not add anon INSERT/UPDATE/DELETE policies here
-- unless you genuinely want the public to be able to write that table directly.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Shared trigger function: keeps updated_at current
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------
-- The app reads the team list from this table at runtime. Adding, renaming or
-- removing a team is a data change only -- no code change required.
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,          -- URL-friendly, used in /teams/[slug]
  logo_url TEXT,                             -- e.g. /images/teams/falcons.png
  primary_color VARCHAR(7) DEFAULT '#523232',-- hex, used for UI accents
  display_order INTEGER NOT NULL DEFAULT 0,  -- controls ordering in the UI
  draft_position SMALLINT UNIQUE,            -- slot in the snake draft, 1..N
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  -- Nullable on purpose: a player with no shirt number yet shows as "TBD".
  -- Postgres treats NULLs as distinct in a UNIQUE constraint, so any number of
  -- players per team can be awaiting a number without colliding.
  jersey_number INTEGER CHECK (jersey_number >= 0 AND jersey_number <= 999),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  position VARCHAR(50),                      -- Forward | Midfielder | Defender | Goalkeeper
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, jersey_number)             -- no duplicate numbers within a team
);

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------
-- Regular season games use week_number 1..total_weeks.
-- Playoff games use week_number = 0 and set playoff_round.
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_number INTEGER NOT NULL UNIQUE,
  week_number INTEGER,
  date DATE NOT NULL,
  time VARCHAR(20) NOT NULL,
  location VARCHAR(200) DEFAULT 'TBD',
  home_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  home_score INTEGER CHECK (home_score >= 0),
  away_score INTEGER CHECK (away_score >= 0),
  status VARCHAR(20) DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
  is_playoff BOOLEAN DEFAULT FALSE,
  playoff_round VARCHAR(50),                 -- play-in | quarterfinal | semifinal | final
  player_of_game_id UUID REFERENCES players(id) ON DELETE SET NULL,
  -- YouTube watch or live URL. A game counts as live when it has a stream and
  -- status = 'in_progress', so there is no separate "is live" flag to forget.
  stream_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- A team cannot play itself, but both sides may be NULL for an unfilled
  -- playoff slot ("winner of the play-in").
  CHECK (home_team_id IS DISTINCT FROM away_team_id
         OR home_team_id IS NULL)
);

-- ---------------------------------------------------------------------------
-- Game statistics (box scores)
-- ---------------------------------------------------------------------------
CREATE TABLE game_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stat_type VARCHAR(20) NOT NULL
    CHECK (stat_type IN ('goal', 'assist', 'save', 'yellow_card', 'red_card', 'blue_card')),
  count INTEGER DEFAULT 1 CHECK (count > 0),
  timestamp VARCHAR(10),                     -- optional in-game clock, e.g. "23:45"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Standings
-- ---------------------------------------------------------------------------
-- One row per team, entered by hand from the admin panel rather than derived
-- from `games` -- the league runs on reported results, not everything being
-- logged as a completed game with a final score. Goal difference and points
-- are computed from these columns wherever the table is read/shown, not
-- stored, so they can never drift out of sync with them.
CREATE TABLE standings (
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

-- ---------------------------------------------------------------------------
-- League configuration (single row)
-- ---------------------------------------------------------------------------
CREATE TABLE league_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_name VARCHAR(200) NOT NULL,
  season VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  current_week INTEGER DEFAULT 1,
  total_weeks INTEGER NOT NULL,
  -- Where the league is in its lifecycle. This drives what the homepage leads
  -- with, so the site follows the season without a code change:
  --   signups   registration form is open
  --   draft     draft under way (starts as soon as signups close)
  --   season    weekly fixtures
  --   playoffs  bracket and final
  phase VARCHAR(20) NOT NULL DEFAULT 'signups'
    CHECK (phase IN ('signups', 'draft', 'season', 'playoffs')),
  -- YouTube watch or live URL for the draft broadcast, set by the admin
  -- before the draft starts. The homepage's "Watch Live" button points here.
  draft_stream_url TEXT,
  -- Whether the homepage shows this week's fixtures / the stat leaders.
  -- `games` and `game_statistics` have no season column, so last season's
  -- rows are still sitting there at the start of a new one -- these stay off
  -- until this season has real games, rather than showing last year's as if
  -- they were current. The schedule generator turns show_home_fixtures on
  -- once it creates the season's games.
  show_home_fixtures BOOLEAN NOT NULL DEFAULT false,
  show_home_stats    BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enforce the "single row" assumption the app relies on.
CREATE UNIQUE INDEX league_config_singleton ON league_config ((true));

-- ---------------------------------------------------------------------------
-- Awards voting
-- ---------------------------------------------------------------------------
CREATE TABLE awards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  season VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,            -- only active awards accept votes
  voting_start_date TIMESTAMPTZ,
  voting_end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE award_nominees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(award_id, player_id)
);

CREATE TABLE award_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  award_id UUID NOT NULL REFERENCES awards(id) ON DELETE CASCADE,
  nominee_id UUID NOT NULL REFERENCES award_nominees(id) ON DELETE CASCADE,
  voter_identifier VARCHAR(255) NOT NULL,    -- browser-generated id, deduped server-side
  voter_name VARCHAR(255),
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(award_id, voter_identifier)         -- one vote per award per voter
);

-- ---------------------------------------------------------------------------
-- Signups
-- ---------------------------------------------------------------------------
-- Registrations taken before the draft. These rows hold contact details, so
-- unlike every other table they are NOT publicly readable -- see the RLS
-- section below. The public can submit through /api/signups; only the admin
-- routes can read them back.
CREATE TABLE signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  -- Email and phone are individually optional but jointly required (see the
  -- constraint below). Email is the useful one -- it carries the payment
  -- details and the confirmation -- but a phone number is enough to register.
  email VARCHAR(255),
  phone VARCHAR(50),
  -- Collected because the league is for 14-25 year olds. The range here is a
  -- typo guard, not the eligibility rule: an out-of-range signup is left for
  -- an organiser to judge in the admin list.
  age SMALLINT CHECK (age BETWEEN 5 AND 99),
  -- Preferred position and rough experience, both free-ish text so the form
  -- can change without a migration.
  position VARCHAR(50),
  experience VARCHAR(50),
  -- Kit details, collected so the order can go in before the season. The
  -- number is a request only: the number a player ends up with is set on the
  -- roster after the draft, where it has to be unique within a team.
  jersey_name VARCHAR(20),
  jersey_number SMALLINT CHECK (jersey_number IS NULL OR jersey_number BETWEEN 0 AND 99),
  jersey_size VARCHAR(5)
    CHECK (jersey_size IS NULL OR jersey_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'withdrawn', 'drafted')),
  -- The sign-up fee. A timestamp rather than a boolean: "when did this arrive"
  -- is the question actually asked when a payment is queried, and NULL answers
  -- "not yet" perfectly well.
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  -- Set once the player has been picked, so the draft can be tracked here
  -- before rosters are built.
  drafted_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  -- Live draft. pick_number is the overall pick, 1..N, and null until taken;
  -- the team on the clock is derived from the highest one rather than stored.
  -- player_id is the roster row the pick created, so undo can remove exactly
  -- that player instead of guessing by name.
  pick_number INTEGER UNIQUE,
  drafted_at TIMESTAMPTZ,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  season VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- A registration with no way to reach the player is useless.
  CONSTRAINT signups_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- One signup per email per season. Case-insensitive, because people are
-- inconsistent about capitalising their own address. Rows with no email at all
-- are excluded, so phone-only registrations do not collide with each other.
CREATE UNIQUE INDEX signups_unique_email_per_season
  ON signups (season, lower(email))
  WHERE email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Questions
-- ---------------------------------------------------------------------------
-- Messages from the contact form. Like signups they carry an email address, so
-- they are not publicly readable either.
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'answered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Commissioner's board
-- ---------------------------------------------------------------------------
-- A running feed of posts from the league admin, shown beside the homepage
-- headline once the season is under way. Each post is text with at most one
-- piece of media attached.
CREATE TABLE commissioner_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  body TEXT NOT NULL,
  media_type VARCHAR(10) NOT NULL DEFAULT 'none'
    CHECK (media_type IN ('none', 'youtube', 'image')),
  -- YouTube watch/live URL when media_type = 'youtube'; uploaded image URL
  -- when media_type = 'image'; null when media_type = 'none'.
  media_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Season archive
-- ---------------------------------------------------------------------------
-- A full, standalone copy of a season's rosters, games, stats and standings,
-- written once by the "archive & reset season" admin action and read-only
-- after that. Separate tables rather than a `season_id` on the live ones --
-- every existing query keeps working unmodified against "whatever is live
-- right now". Team identity (name/logo/colour) is snapshotted into
-- archive_teams too, so the archive still looks right even if a team is
-- later renamed or removed from the live `teams` table.
CREATE TABLE archive_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(100) NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE archive_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_season_id UUID NOT NULL REFERENCES archive_seasons(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  logo_url TEXT,
  primary_color VARCHAR(7),
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE archive_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_season_id UUID NOT NULL REFERENCES archive_seasons(id) ON DELETE CASCADE,
  archive_team_id UUID REFERENCES archive_teams(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  jersey_number INTEGER,
  position VARCHAR(50)
);

CREATE TABLE archive_games (
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

CREATE TABLE archive_game_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archive_game_id UUID REFERENCES archive_games(id) ON DELETE CASCADE,
  archive_player_id UUID REFERENCES archive_players(id) ON DELETE SET NULL,
  archive_team_id UUID REFERENCES archive_teams(id) ON DELETE SET NULL,
  stat_type VARCHAR(20) NOT NULL,
  count INTEGER DEFAULT 1,
  timestamp VARCHAR(10)
);

CREATE TABLE archive_standings (
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

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX idx_teams_order          ON teams(display_order);
CREATE INDEX idx_players_team         ON players(team_id);
CREATE INDEX idx_players_active       ON players(is_active);
CREATE INDEX idx_games_date           ON games(date);
CREATE INDEX idx_games_week           ON games(week_number);
CREATE INDEX idx_games_status         ON games(status);
CREATE INDEX idx_games_playoff        ON games(week_number) WHERE week_number = 0;
CREATE INDEX idx_games_player_of_game ON games(player_of_game_id);
CREATE INDEX idx_game_stats_game      ON game_statistics(game_id);
CREATE INDEX idx_game_stats_player    ON game_statistics(player_id);
CREATE INDEX idx_game_stats_type      ON game_statistics(stat_type);
CREATE INDEX idx_awards_season        ON awards(season);
CREATE INDEX idx_awards_active        ON awards(is_active);
CREATE INDEX idx_award_nominees_award ON award_nominees(award_id);
CREATE INDEX idx_award_votes_award    ON award_votes(award_id);
CREATE INDEX idx_award_votes_nominee  ON award_votes(nominee_id);
CREATE INDEX idx_signups_status       ON signups(status);
CREATE INDEX idx_signups_season       ON signups(season);
CREATE INDEX idx_questions_status     ON questions(status);
CREATE INDEX idx_questions_created    ON questions(created_at DESC);
CREATE INDEX idx_commissioner_posts_created ON commissioner_posts(created_at DESC);
CREATE INDEX idx_archive_teams_season       ON archive_teams(archive_season_id);
CREATE INDEX idx_archive_players_season     ON archive_players(archive_season_id);
CREATE INDEX idx_archive_players_team       ON archive_players(archive_team_id);
CREATE INDEX idx_archive_games_season       ON archive_games(archive_season_id);
CREATE INDEX idx_archive_game_stats_game    ON archive_game_statistics(archive_game_id);
CREATE INDEX idx_archive_standings_season   ON archive_standings(archive_season_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
CREATE TRIGGER update_teams_updated_at         BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at       BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_games_updated_at         BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_standings_updated_at     BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_league_config_updated_at BEFORE UPDATE ON league_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_awards_updated_at        BEFORE UPDATE ON awards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signups_updated_at       BEFORE UPDATE ON signups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_questions_updated_at     BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commissioner_posts_updated_at BEFORE UPDATE ON commissioner_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Public (anon key) gets SELECT and nothing else. All writes happen server-side
-- with the service role key, which bypasses RLS entirely.
ALTER TABLE teams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE players          ENABLE ROW LEVEL SECURITY;
ALTER TABLE games            ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE standings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE awards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_nominees   ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE signups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissioner_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_seasons         ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_teams           ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_players         ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_games           ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_standings       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read" ON teams           FOR SELECT USING (true);
CREATE POLICY "public read" ON players         FOR SELECT USING (true);
CREATE POLICY "public read" ON games           FOR SELECT USING (true);
CREATE POLICY "public read" ON game_statistics FOR SELECT USING (true);
CREATE POLICY "public read" ON standings       FOR SELECT USING (true);
CREATE POLICY "public read" ON league_config   FOR SELECT USING (true);
CREATE POLICY "public read" ON awards          FOR SELECT USING (true);
CREATE POLICY "public read" ON award_nominees  FOR SELECT USING (true);
CREATE POLICY "public read" ON award_votes     FOR SELECT USING (true);
CREATE POLICY "public read" ON commissioner_posts FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_seasons         FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_teams           FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_players         FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_games           FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_game_statistics FOR SELECT USING (true);
CREATE POLICY "public read" ON archive_standings       FOR SELECT USING (true);

-- Deliberately NO policy for `signups` or `questions`: they hold email
-- addresses and phone numbers. With RLS on and no policy, the anon key can
-- neither read nor write them. Submissions and the admin lists both go through
-- server routes using the service role key.

-- ---------------------------------------------------------------------------
-- Storage: standings screenshots and team logos
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('league-images', 'league-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view; only the service role (server routes) can write.
DROP POLICY IF EXISTS "league images public read" ON storage.objects;
CREATE POLICY "league images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'league-images');

-- ---------------------------------------------------------------------------
-- Seed: league configuration
-- ---------------------------------------------------------------------------
-- Adjust dates and total_weeks to match the real season, then re-run just this
-- statement if it changes. current_week is controlled from the admin UI.
INSERT INTO league_config (
  league_name, season, start_date, end_date, current_week, total_weeks, phase
) VALUES (
  'Chicken Shop Premier League', 'Fall 2026', '2026-09-10', '2026-11-26', 1, 10,
  'signups'
);

COMMENT ON TABLE teams           IS 'Teams in the league; the app reads this list at runtime';
COMMENT ON TABLE players         IS 'Player rosters';
COMMENT ON TABLE games           IS 'Scheduled and completed games, regular season and playoff';
COMMENT ON TABLE game_statistics IS 'Box score statistics';
COMMENT ON TABLE league_config   IS 'Global league configuration (single row)';
COMMENT ON TABLE awards          IS 'End-of-season awards open for voting';
COMMENT ON TABLE signups         IS 'Pre-draft registrations. Contains contact details; not publicly readable';
COMMENT ON TABLE questions       IS 'Contact form messages. Contains email addresses; not publicly readable';
