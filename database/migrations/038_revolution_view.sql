-- ---------------------------------------------------------------------------
-- Revolution: a special view of the site
--
-- Switched on and off from the admin bar on the homepage. While it is on:
--   - the schedule page leaves out matchweeks 1-3
--   - team pages leave out their past fixtures (results)
--   - the standings tab is hidden: the header and footer links, the
--     homepage's Standings button, and the standings page itself
--
-- Nothing is deleted: switching it off brings everything back as it was.
-- ---------------------------------------------------------------------------

ALTER TABLE league_config
  ADD COLUMN IF NOT EXISTS revolution_view BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN league_config.revolution_view IS
  'The Revolution view: hides matchweeks 1-3, past fixtures on team pages, and the standings.';
