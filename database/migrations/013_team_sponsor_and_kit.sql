-- ---------------------------------------------------------------------------
-- Team sponsors and kit artwork
--
-- Sponsorship is sold per team and turns over between seasons, so it lives on
-- the team row rather than in a sponsors table: a team has at most one, and
-- nothing else in the league references a sponsor. Both columns are nullable
-- because teams are sold sponsorships through the season -- an unsponsored team
-- simply renders without the block.
--
-- `sponsor_name` is the display name, which is NOT the legal entity name: the
-- Fall 2026 sponsors trade under names like "JAX FISH AND CHICKEN" while the
-- team is "Central Sporting Club Of PURO".
--
-- Kit artwork is one image per team showing the full set (home and away in a
-- single export), which is why this is `kit_image_url` and not a home/away
-- pair.
-- ---------------------------------------------------------------------------

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS sponsor_name      VARCHAR(120),
  ADD COLUMN IF NOT EXISTS sponsor_logo_url  TEXT,
  ADD COLUMN IF NOT EXISTS kit_image_url     TEXT;

COMMENT ON COLUMN teams.sponsor_name IS
  'Sponsor display name, e.g. "JAX FISH AND CHICKEN". NULL until a sponsor is signed.';
COMMENT ON COLUMN teams.sponsor_logo_url IS
  'Sponsor logo path, e.g. /images/sponsors/jaxfnc.png. NULL until a sponsor is signed.';
COMMENT ON COLUMN teams.kit_image_url IS
  'Kit mockup showing the full set, e.g. /images/teams/kits/cscp.png.';
