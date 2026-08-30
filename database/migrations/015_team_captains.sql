-- ---------------------------------------------------------------------------
-- Team captains
--
-- A captain is placed on their team before the draft rather than picked in it.
-- That leaves their registration in an unusual state, and the state is the
-- whole point: `status` stays 'confirmed' (they registered and paid like
-- anyone else) and `pick_number` stays NULL (no pick was spent on them), but
-- `player_id` is set, because they are on a roster.
--
-- `player_id IS NOT NULL` is therefore what removes them from the draft pool,
-- not their status -- see isDraftable() in lib/draft.ts. Leaving pick_number
-- NULL matters: the board derives the next pick from how many rows carry one,
-- so giving captains pick numbers would push the whole draft eight picks in.
-- ---------------------------------------------------------------------------

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_captain BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN players.is_captain IS
  'Placed on the team before the draft rather than picked in it.';

-- Fall 2026 captains, matched to their registration by name so their shirt
-- number and position come across with them.
WITH captain (slug, signup_name) AS (
  VALUES
    ('cscp',       'Rami Hessen'),
    ('sccairo',    'Ali Gamal'),
    ('scparis',    'Muhammad Karim Cisse'),
    ('scdakar',    'Hamza H. Abdushaheed'),
    ('scramallah', 'Mohamad Salama'),
    ('sckabul',    'Rafe Sherzai'),
    ('scistanbul', 'Omar Helmy'),
    ('scmansoura', 'Louay Elimam')
),
matched AS (
  SELECT t.id AS team_id, s.id AS signup_id, s.name, s.jersey_number, s.position
  FROM captain c
  JOIN teams t ON t.slug = c.slug
  JOIN signups s ON lower(s.name) = lower(c.signup_name)
  -- Only where the name identifies exactly one registration, and only where
  -- that person is not already on a roster. Both guards make this re-runnable
  -- and stop a duplicate name being placed on the wrong team silently.
  WHERE s.player_id IS NULL
    AND (SELECT count(*) FROM signups d WHERE lower(d.name) = lower(c.signup_name)) = 1
),
placed AS (
  INSERT INTO players (name, jersey_number, team_id, position, is_active, is_captain)
  SELECT name, jersey_number, team_id, position, true, true FROM matched
  RETURNING id, team_id, name
)
UPDATE signups s
SET player_id = p.id
FROM placed p, matched m
WHERE p.team_id = m.team_id
  AND p.name = m.name
  AND s.id = m.signup_id;

-- Check: eight rows, each captain against their club and shirt number.
SELECT t.name AS team, p.name AS captain, p.jersey_number, p.position,
       (s.id IS NOT NULL) AS registration_linked
FROM players p
JOIN teams t ON t.id = p.team_id
LEFT JOIN signups s ON s.player_id = p.id
WHERE p.is_captain
ORDER BY t.display_order;
