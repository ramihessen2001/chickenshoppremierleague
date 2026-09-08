-- ============================================================================
-- Migration 025 — subscribers
-- ============================================================================
-- Run this ONCE. A brand new project should run schema.sql instead — it
-- already includes this table.
--
-- WHY THIS EXISTS
-- ---------------
-- /api/subscribe used to forward an address to Klaviyo and keep nothing, on
-- the reasoning that the list was the record. That held right up until the
-- request started failing: a malformed payload was rejected by Klaviyo for two
-- days while the form told everybody "You're on the list", and because nothing
-- was written down first, those addresses are gone — Vercel's runtime logs
-- were the only copy and they aged out before anyone noticed.
--
-- So the address is written here the moment it arrives, before Klaviyo is
-- called. A provider outage or another bad payload now costs a retry rather
-- than the address.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Stored as entered but matched case-insensitively; see the index below.
  email VARCHAR(254) NOT NULL,
  -- Which list this belongs on. Mirrors KlaviyoAudience in lib/klaviyo.ts:
  -- league news is a separate consent from PURO's own marketing.
  audience VARCHAR(20) NOT NULL DEFAULT 'league'
    CHECK (audience IN ('league', 'marketing')),
  -- Where the address came from, for when a list needs explaining later.
  source VARCHAR(40) NOT NULL DEFAULT 'popup',
  -- When we took the address. This is the consent record.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NULL until Klaviyo has accepted it. NULL plus a last_error is the queue.
  synced_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_attempt_at TIMESTAMPTZ,
  -- Klaviyo's own words, kept verbatim: their JSON:API errors name the exact
  -- field, which is the only way to tell a bad list id from a bad payload.
  last_error TEXT
);

-- One row per address per list. Case-insensitive, because people are
-- inconsistent about capitalising their own address.
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_unique_email_per_audience
  ON subscribers (audience, lower(email));

-- The retry queue: everything still waiting on Klaviyo, oldest first.
CREATE INDEX IF NOT EXISTS idx_subscribers_unsynced
  ON subscribers (created_at) WHERE synced_at IS NULL;

-- Deliberately NO policy, exactly as for `signups`: this holds email
-- addresses. With RLS on and no policy the anon key can read nothing, and
-- every write goes through a server route on the service role key.
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify — expect the table to exist and be empty.
-- ---------------------------------------------------------------------------
-- SELECT count(*) FILTER (WHERE synced_at IS NOT NULL) AS synced,
--        count(*) FILTER (WHERE synced_at IS NULL)     AS waiting
--   FROM subscribers;
