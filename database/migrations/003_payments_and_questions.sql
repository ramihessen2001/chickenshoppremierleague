-- ============================================================================
-- Migration 003 — payment tracking, and the contact form inbox
-- ============================================================================
-- Run this ONCE against a database that already has the signups table. A brand
-- new project should run schema.sql instead — it already includes all of this.
--
-- Safe to run on a database with live data: it adds two nullable columns and
-- one new table, and touches no existing rows. Everyone already registered
-- reads as unpaid until you mark them.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Payment tracking on signups
-- ---------------------------------------------------------------------------
-- Deliberately a timestamp rather than a boolean: "when did this arrive" is
-- the question being asked when a payment is disputed, and a NULL answers
-- "not yet" perfectly well.
ALTER TABLE signups ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

COMMENT ON COLUMN signups.paid_at IS 'When the sign-up fee arrived; NULL means unpaid';
COMMENT ON COLUMN signups.payment_method IS 'Zelle, Cash App, Venmo, Cash, Other';

-- ---------------------------------------------------------------------------
-- 2. Questions from the contact form
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'answered')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Like signups, these rows carry an email address, so they get NO policy at
-- all: with RLS on and no policy the anon key can neither read nor write them.
-- Submissions go through /api/questions and reads through /api/admin/questions,
-- both server-side with the service role key.
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE questions IS
  'Contact form messages. Contains email addresses; not publicly readable';

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
-- SELECT name, paid_at, payment_method FROM signups ORDER BY created_at DESC LIMIT 5;
-- SELECT COUNT(*) FROM questions;
