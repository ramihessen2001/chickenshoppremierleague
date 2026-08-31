-- ---------------------------------------------------------------------------
-- Correcting the Fall 2026 draft
--
-- The draft ran the uncapped snake: eight teams in every round, so the pool
-- ran dry six picks into round seven. Dakar and Mansoura took a seventh pick
-- they should not have had (they were capped at six rounds), and Cairo and
-- Kabul -- seventh and eighth in the order -- got none at all.
--
-- The cause was not the data: draft_rounds was set correctly. The build
-- running at the time predated migration 019 and did not read the column.
--
-- Those two extra picks were the last two of round seven, so undoing them is
-- exactly this:
--
--   #51  Alind Zakholi      Dakar    -> Cairo
--   #52  Ezzaldin Shammout  Mansoura -> Kabul
--
-- Afterwards: Dakar 9, Mansoura 9, everyone else 8. Sixty-six players.
--
-- Unlike a trade, this rewrites drafted_team_id as well as the roster: the
-- pick was recorded against the wrong club, and the record should say what
-- should have happened. A trade moves only players.team_id, leaving
-- drafted_team_id as the history of who actually drafted whom.
--
-- Neither player clashes on their new club: both wear #3, and neither Cairo
-- nor Kabul has a #3.
-- ---------------------------------------------------------------------------

WITH correction (player_name, to_slug) AS (
  VALUES
    ('Alind Zakholi',     'sccairo'),
    ('Ezzaldin Shammout', 'sckabul')
),
target AS (
  SELECT p.id AS player_id, s.id AS signup_id, t.id AS team_id, c.player_name
  FROM correction c
  JOIN teams t ON t.slug = c.to_slug
  JOIN players p ON lower(p.name) = lower(c.player_name)
  LEFT JOIN signups s ON s.player_id = p.id
  -- One player of that name, and not already on the destination club, so this
  -- is safe to run twice.
  WHERE p.team_id <> t.id
    AND (SELECT count(*) FROM players d WHERE lower(d.name) = lower(c.player_name)) = 1
),
moved AS (
  UPDATE players p SET team_id = tg.team_id
  FROM target tg WHERE p.id = tg.player_id
  RETURNING p.id
)
UPDATE signups s SET drafted_team_id = tg.team_id
FROM target tg
WHERE s.id = tg.signup_id;

-- Check: 9, 9, and 8 everywhere else.
SELECT t.name, count(p.id) AS squad
FROM teams t LEFT JOIN players p ON p.team_id = t.id
GROUP BY t.id, t.name, t.display_order
ORDER BY t.display_order;
