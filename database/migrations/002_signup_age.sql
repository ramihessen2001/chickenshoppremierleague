-- ============================================================================
-- Migration 002 — age on signups
-- ============================================================================
-- Run this ONCE against a database that already has the signups table. A brand
-- new project should run schema.sql instead — it already includes the column.
--
-- Safe to run on a database with live data: it adds a nullable column and
-- touches no existing rows. Signups taken before this migration keep a NULL
-- age, which the admin list simply omits.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

ALTER TABLE signups ADD COLUMN IF NOT EXISTS age SMALLINT;

-- A typo guard rather than the league's eligibility rule (14-25): the form
-- accepts any plausible age and leaves the judgement to an organiser.
ALTER TABLE signups DROP CONSTRAINT IF EXISTS signups_age_check;
ALTER TABLE signups
  ADD CONSTRAINT signups_age_check CHECK (age IS NULL OR age BETWEEN 5 AND 99);

COMMENT ON COLUMN signups.age IS 'Age at registration; NULL for signups taken before this column existed';

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT name, age FROM signups ORDER BY created_at DESC LIMIT 5;
