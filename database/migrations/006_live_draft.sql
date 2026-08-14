-- Live draft: run the draft from the site itself.
--
-- Three additions, all nullable or defaulted, so this is safe to run against a
-- database mid-season:
--
--   teams.draft_position   the snake order, 1..N. Null means "not in the draft".
--   signups.pick_number    overall pick, 1..N. Null until the player is taken.
--   signups.drafted_at     when the pick happened, for the live feed's ordering.
--   signups.player_id      the roster row this pick created.
--
-- The team on the clock is DERIVED from the highest pick_number rather than
-- stored, so there is no "current pick" counter to drift out of step with the
-- picks themselves. Undoing a pick is then just clearing the row.
--
-- player_id exists so undo can remove exactly the player the pick created,
-- rather than guessing by name, and so the board can read back the shirt number
-- that was actually assigned. ON DELETE SET NULL: deleting a player from the
-- roster editor un-links the pick instead of destroying the registration.

ALTER TABLE teams   ADD COLUMN IF NOT EXISTS draft_position SMALLINT;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS pick_number    INTEGER;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS drafted_at     TIMESTAMPTZ;
ALTER TABLE signups ADD COLUMN IF NOT EXISTS player_id      UUID
  REFERENCES players(id) ON DELETE SET NULL;

-- Two players cannot hold the same pick. Partial, because every undrafted
-- signup has pick_number NULL and those must not collide with each other.
CREATE UNIQUE INDEX IF NOT EXISTS signups_pick_number_key
  ON signups (pick_number)
  WHERE pick_number IS NOT NULL;

-- Likewise no two teams can share a slot in the order.
CREATE UNIQUE INDEX IF NOT EXISTS teams_draft_position_key
  ON teams (draft_position)
  WHERE draft_position IS NOT NULL;

-- Seed the order from the existing display order so the draft is runnable
-- immediately. Change it from the admin console before the draft starts.
UPDATE teams
   SET draft_position = ordered.position
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY display_order, name) AS position
      FROM teams
  ) AS ordered
 WHERE teams.id = ordered.id
   AND teams.draft_position IS NULL;

COMMENT ON COLUMN teams.draft_position   IS 'Slot in the snake draft order, 1..N';
COMMENT ON COLUMN signups.pick_number    IS 'Overall draft pick, 1..N; null until drafted';
COMMENT ON COLUMN signups.drafted_at     IS 'When the pick was made';
