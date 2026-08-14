-- ============================================================================
-- Migration 004 — email or phone, rather than email always
-- ============================================================================
-- Run this ONCE against a database that already has the signups table. A brand
-- new project should run schema.sql instead — it already includes this.
--
-- Safe to run on a database with live data: every existing signup has an email
-- address, so the new rule is already satisfied and no row changes.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

-- Email is no longer compulsory on its own...
ALTER TABLE signups ALTER COLUMN email DROP NOT NULL;

-- ...but a registration with neither way to reach the player is useless.
ALTER TABLE signups DROP CONSTRAINT IF EXISTS signups_contact_check;
ALTER TABLE signups
  ADD CONSTRAINT signups_contact_check CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- The one-per-season rule has to skip the rows with no address: without the
-- WHERE clause, the second phone-only signup collides with the first on NULL
-- in some Postgres versions, and the constraint means nothing in the rest.
DROP INDEX IF EXISTS signups_unique_email_per_season;
CREATE UNIQUE INDEX signups_unique_email_per_season
  ON signups (season, lower(email))
  WHERE email IS NOT NULL;

COMMENT ON COLUMN signups.email IS
  'NULL only when the player registered with a phone number instead';

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT name, email, phone FROM signups ORDER BY created_at DESC LIMIT 5;
