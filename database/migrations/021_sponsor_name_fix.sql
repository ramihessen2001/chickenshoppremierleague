-- ---------------------------------------------------------------------------
-- Sponsor name correction
--
-- The club trades as HOOK FISH AND CHICKEN, singular. Only the displayed name
-- changes: the logo stays at /images/sponsors/hooks.svg, since that path is an
-- identifier the row points at rather than anything a reader sees.
-- ---------------------------------------------------------------------------

UPDATE teams
SET sponsor_name = 'HOOK FISH AND CHICKEN'
WHERE slug = 'scramallah';

SELECT slug, name, sponsor_name FROM teams
WHERE sponsor_name IS NOT NULL ORDER BY display_order;
