-- Drop the 'preseason' phase: the draft now starts as soon as signups close,
-- so there is no separate holding period between them.
--
-- Any row currently sitting at 'preseason' moves to 'draft' before the CHECK
-- constraint is tightened, so the update never fails against live data.

UPDATE league_config SET phase = 'draft' WHERE phase = 'preseason';

ALTER TABLE league_config DROP CONSTRAINT league_config_phase_check;
ALTER TABLE league_config ADD CONSTRAINT league_config_phase_check
  CHECK (phase IN ('signups', 'draft', 'season', 'playoffs'));

COMMENT ON COLUMN league_config.phase IS
  'Lifecycle stage: signups | draft | season | playoffs';
