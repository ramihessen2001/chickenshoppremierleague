-- ============================================================================
-- Migration 023 — headshot and age on players
-- ============================================================================
-- Run this ONCE against a database that already has the players table. A brand
-- new project should run schema.sql instead — it already includes both columns.
--
-- Safe to run on a database with live data: it adds two nullable columns and
-- backfills age from the registration each player came in on.
--
-- WHY AGE IS COPIED RATHER THAN JOINED
-- ------------------------------------
-- Age is collected on `signups`, and `signups` has no public read policy on
-- purpose — it holds emails and phone numbers. The player profile card is a
-- public page, so it cannot read that table. Copying the one field that
-- belongs on a profile keeps the contact details where they are.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

ALTER TABLE players
  -- Path under /public, e.g. /images/players/yaseen-jawhar.jpg. NULL means the
  -- profile falls back to a file named after the player, and then to initials.
  ADD COLUMN IF NOT EXISTS headshot_url TEXT,
  ADD COLUMN IF NOT EXISTS age SMALLINT;

-- A typo guard rather than the league's eligibility rule (14-25), matching the
-- constraint already on signups.age.
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_age_check;
ALTER TABLE players
  ADD CONSTRAINT players_age_check CHECK (age IS NULL OR age BETWEEN 5 AND 99);

COMMENT ON COLUMN players.headshot_url IS
  'Portrait for the player profile; NULL falls back to a name-matched file, then initials.';
COMMENT ON COLUMN players.age IS
  'Age at registration, copied from signups because signups is not publicly readable.';

-- Backfill from the registration each player was drafted or placed from.
-- Only fills blanks, so re-running it never overwrites a hand-corrected age.
UPDATE players p
   SET age = s.age
  FROM signups s
 WHERE s.player_id = p.id
   AND s.age IS NOT NULL
   AND p.age IS NULL;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify — expect 66 players with an age and 0 without.
-- ---------------------------------------------------------------------------
-- SELECT count(*) FILTER (WHERE age IS NOT NULL) AS with_age,
--        count(*) FILTER (WHERE age IS NULL)     AS without_age
--   FROM players;
