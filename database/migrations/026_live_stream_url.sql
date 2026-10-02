-- ---------------------------------------------------------------------------
-- Homepage livestream
--
-- A league-wide broadcast, set from the admin bar on the homepage during the
-- season and playoffs. While it holds a link, the stream takes over the top of
-- the homepage -- the headline and the commissioner's board step aside -- and
-- clearing it puts them back.
--
-- Separate from games.stream_url, which belongs to one fixture and shows in
-- the "Live now" strip only while that game is in progress, and from
-- draft_stream_url, which only the draft phase reads. This one has no game or
-- phase to end it, so it stays live until the admin clears it.
-- ---------------------------------------------------------------------------

ALTER TABLE league_config ADD COLUMN IF NOT EXISTS live_stream_url TEXT;

COMMENT ON COLUMN league_config.live_stream_url IS
  'YouTube watch or live URL shown in place of the homepage headline while set. NULL when nothing is live.';
