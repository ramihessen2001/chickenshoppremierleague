-- ============================================================================
-- Migration 001 — signups, season phases, YouTube streams
-- ============================================================================
-- Run this ONCE against a database that was created with the original
-- schema.sql (the version with `playoffs_started`). If you are setting up a
-- brand new project instead, just run schema.sql — it already includes all of
-- this and you should skip this file.
--
-- Safe to run on a database with live data: nothing here drops a table or
-- touches existing rows beyond backfilling the new `phase` column.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Season phase replaces the playoffs_started boolean
-- ---------------------------------------------------------------------------
ALTER TABLE league_config
  ADD COLUMN IF NOT EXISTS phase VARCHAR(20) NOT NULL DEFAULT 'signups';

-- Carry the old boolean across before it goes: a league already in the
-- playoffs stays there, anything else is assumed to be mid-season. If you are
-- actually still taking signups, set it to 'signups' from the admin panel.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'league_config' AND column_name = 'playoffs_started'
  ) THEN
    UPDATE league_config
    SET phase = CASE WHEN playoffs_started THEN 'playoffs' ELSE 'season' END;

    ALTER TABLE league_config DROP COLUMN playoffs_started;
  END IF;
END $$;

ALTER TABLE league_config DROP CONSTRAINT IF EXISTS league_config_phase_check;
ALTER TABLE league_config
  ADD CONSTRAINT league_config_phase_check
  CHECK (phase IN ('signups', 'preseason', 'draft', 'season', 'playoffs'));

COMMENT ON COLUMN league_config.phase IS
  'Lifecycle stage: signups | preseason | draft | season | playoffs';

-- ---------------------------------------------------------------------------
-- 2. Livestream URL on games
-- ---------------------------------------------------------------------------
-- A game is live when it has a stream_url AND status = 'in_progress', so there
-- is no separate flag that can be left switched on after full time.
ALTER TABLE games ADD COLUMN IF NOT EXISTS stream_url TEXT;

COMMENT ON COLUMN games.stream_url IS 'YouTube watch or live URL for this game';

-- ---------------------------------------------------------------------------
-- 3. Signups
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  position VARCHAR(50),
  experience VARCHAR(50),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'waitlisted', 'withdrawn', 'drafted')),
  drafted_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  season VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One signup per email per season, case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS signups_unique_email_per_season
  ON signups (season, lower(email));

CREATE INDEX IF NOT EXISTS idx_signups_status ON signups(status);
CREATE INDEX IF NOT EXISTS idx_signups_season ON signups(season);

DROP TRIGGER IF EXISTS update_signups_updated_at ON signups;
CREATE TRIGGER update_signups_updated_at BEFORE UPDATE ON signups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Signups hold email addresses and phone numbers, so unlike every other table
-- they get NO policy at all. With RLS enabled and no policy, the anon key can
-- neither read nor write them. Submissions and the admin list both go through
-- server routes using the service role key.
ALTER TABLE signups ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE signups IS
  'Pre-draft registrations. Contains contact details; not publicly readable';

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT phase FROM league_config;
-- SELECT COUNT(*) FROM signups;
