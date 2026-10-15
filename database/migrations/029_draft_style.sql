-- ---------------------------------------------------------------------------
-- Graphic style on content desk drafts
--
-- Which style a draft's graphic is drawn in: an id from the style library in
-- lib/graphics/styles.ts ('puro', the league's house style, unless the media
-- team or the brief chose another). Not constrained to a list here, because
-- styles are added in code; an id the code no longer knows is drawn as PURO.
-- ---------------------------------------------------------------------------

ALTER TABLE content_drafts
  ADD COLUMN IF NOT EXISTS style VARCHAR(40) NOT NULL DEFAULT 'puro';

COMMENT ON COLUMN content_drafts.style IS
  'Graphic style id from lib/graphics/styles.ts; unknown ids render as PURO.';
