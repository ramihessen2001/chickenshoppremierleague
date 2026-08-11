-- Add standings_image_url column to league_config table
-- This will store the URL of the uploaded standings image

ALTER TABLE league_config
ADD COLUMN standings_image_url TEXT;

COMMENT ON COLUMN league_config.standings_image_url IS 'URL of the uploaded league standings image';


