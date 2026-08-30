-- ---------------------------------------------------------------------------
-- How many rounds a club takes part in
--
-- NULL means every round, which is the normal case. A number caps it, for a
-- club that starts the draft with players already on its books and so reaches
-- the same squad size from fewer picks.
--
-- Fall 2026: Dakar and Mansoura each begin with three (a captain and two
-- awarded players) and finish on nine, so they pick in the first six rounds
-- and then drop out. The snake carries on among the remaining six -- see
-- pickSequence() in lib/draft.ts, which generates the order rather than
-- calculating it, precisely because rounds stop being a fixed length here.
-- ---------------------------------------------------------------------------

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS draft_rounds SMALLINT
    CHECK (draft_rounds IS NULL OR draft_rounds > 0);

COMMENT ON COLUMN teams.draft_rounds IS
  'Rounds this club picks in. NULL means every round.';

UPDATE teams SET draft_rounds = 6 WHERE slug IN ('scdakar', 'scmansoura');

SELECT slug, name, draft_rounds FROM teams ORDER BY display_order;
