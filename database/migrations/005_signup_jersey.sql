-- ============================================================================
-- Migration 005 — jersey details on signups
-- ============================================================================
-- Run this ONCE against a database that already has the signups table. A brand
-- new project should run schema.sql instead — it already includes this.
--
-- Safe to run on a database with live data: it adds three nullable columns and
-- touches no existing rows. The form requires all three from now on; anyone who
-- registered before this reads as blank and has to be asked in person.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

-- Nullable in the database, required by the form. The constraint is deliberate:
-- registrations already taken have no jersey details and must not be
-- invalidated by this.
ALTER TABLE signups ADD COLUMN IF NOT EXISTS jersey_name VARCHAR(20);
ALTER TABLE signups ADD COLUMN IF NOT EXISTS jersey_number SMALLINT;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS jersey_size VARCHAR(5);

ALTER TABLE signups DROP CONSTRAINT IF EXISTS signups_jersey_number_check;
ALTER TABLE signups
  ADD CONSTRAINT signups_jersey_number_check
  CHECK (jersey_number IS NULL OR jersey_number BETWEEN 0 AND 99);

ALTER TABLE signups DROP CONSTRAINT IF EXISTS signups_jersey_size_check;
ALTER TABLE signups
  ADD CONSTRAINT signups_jersey_size_check
  CHECK (jersey_size IS NULL OR jersey_size IN ('XS', 'S', 'M', 'L', 'XL', 'XXL'));

COMMENT ON COLUMN signups.jersey_name IS 'Name to print on the back of the kit';
COMMENT ON COLUMN signups.jersey_number IS
  'Requested squad number. Not binding: the number on the roster is assigned after the draft, where it has to be unique within a team';
COMMENT ON COLUMN signups.jersey_size IS 'XS | S | M | L | XL | XXL';

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT name, jersey_name, jersey_number, jersey_size FROM signups
--   ORDER BY created_at DESC LIMIT 5;
--
-- The kit order, once registrations are in:
-- SELECT jersey_size, COUNT(*) FROM signups
--   WHERE status = 'confirmed' GROUP BY jersey_size ORDER BY jersey_size;
