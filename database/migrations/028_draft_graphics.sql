-- ---------------------------------------------------------------------------
-- Graphics on content desk drafts
--
-- A draft can now carry a picture as well as a caption: one of the four
-- 1080x1440 templates (Team of the Week, League Table, Stat Leaders,
-- Matchweek Slate). `graphic` is a snapshot of exactly what the picture shows,
-- taken when the draft was written -- the PNG is drawn from it on request, so
-- an approved graphic does not change if a result is corrected later. NULL for
-- a caption-only draft.
--
-- `ground` is the background the media team picked for it: black (the
-- default, for social feeds) or bone (the website's ground).
-- ---------------------------------------------------------------------------

ALTER TABLE content_drafts
  ADD COLUMN IF NOT EXISTS graphic JSONB,
  ADD COLUMN IF NOT EXISTS ground VARCHAR(5) NOT NULL DEFAULT 'black';

ALTER TABLE content_drafts DROP CONSTRAINT IF EXISTS content_drafts_ground_check;
ALTER TABLE content_drafts
  ADD CONSTRAINT content_drafts_ground_check CHECK (ground IN ('black', 'bone'));

COMMENT ON COLUMN content_drafts.graphic IS
  'Snapshot of the attached graphic (lib/graphics/spec.ts). NULL for a caption-only draft.';
COMMENT ON COLUMN content_drafts.ground IS
  'Background for the graphic: black or bone.';
