-- The homepage's "Watch Live" button, shown during the draft phase, now
-- points at a YouTube stream instead of the admin-run draft board. The
-- admin sets the link here before the draft starts.

ALTER TABLE league_config ADD COLUMN IF NOT EXISTS draft_stream_url TEXT;

COMMENT ON COLUMN league_config.draft_stream_url IS
  'YouTube watch or live URL for the draft broadcast';
