-- ---------------------------------------------------------------------------
-- Content desk drafts
--
-- What the content agent writes for the media team at /desk. Every draft
-- starts as 'draft'; the media team edits it, then approves it (ready to copy
-- out to Instagram and the rest) or discards it. Nothing here is ever shown on
-- the public site, and the agent has no way to publish -- a person copies an
-- approved draft out by hand.
--
-- `kind` is the preset the draft was started from ('match_report',
-- 'weekly_roundup', ... or 'custom' for a free-form brief). It is a label for
-- filtering, not a constraint, so a new preset needs no migration.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind VARCHAR(40) NOT NULL DEFAULT 'custom',
  brief TEXT NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'discarded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_drafts_created
  ON content_drafts(created_at DESC);

DROP TRIGGER IF EXISTS update_content_drafts_updated_at ON content_drafts;
CREATE TRIGGER update_content_drafts_updated_at BEFORE UPDATE ON content_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS on with no policies: unreadable with the public anon key. Only the
-- server, through the service role behind /api/media, can touch these rows.
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
