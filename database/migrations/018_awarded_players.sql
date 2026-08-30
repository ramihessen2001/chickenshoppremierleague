-- ---------------------------------------------------------------------------
-- Players awarded to a club before the draft, Fall 2026
--
-- Same mechanism as the captains in migration 015 -- a player row plus a
-- signups.player_id, which is what removes them from the pool -- but
-- is_captain stays false: they are squad members, not captains, and should
-- carry no armband on the roster.
--
-- Yaseen Jawhar registered for #17, which is already on Dakar's captain, and
-- shirt numbers are unique within a team. He takes #16, the nearest free
-- number below the one he asked for, which is what the draft's own suggester
-- would have offered.
-- ---------------------------------------------------------------------------

WITH award (slug, signup_name, override_number) AS (
  VALUES
    ('scdakar',    'Yahya Guissou', NULL::smallint),
    ('scdakar',    'Yaseen Jawhar', 16::smallint),
    ('scmansoura', 'Yusuf Sadiq',   NULL::smallint),
    ('scmansoura', 'Khriwesh',      NULL::smallint)
),
matched AS (
  SELECT t.id AS team_id,
         s.id AS signup_id,
         s.name,
         COALESCE(a.override_number, s.jersey_number) AS jersey_number,
         s.position
  FROM award a
  JOIN teams t ON t.slug = a.slug
  JOIN signups s ON lower(s.name) = lower(a.signup_name)
  -- Exactly one registration by that name, and not already on a roster: the
  -- same guards as migration 015, so this is safe to re-run. "Khriwesh" is
  -- deliberately matched in full -- there is also a "Mohammad Khriwesh".
  WHERE s.player_id IS NULL
    AND (SELECT count(*) FROM signups d WHERE lower(d.name) = lower(a.signup_name)) = 1
),
placed AS (
  INSERT INTO players (name, jersey_number, team_id, position, is_active, is_captain)
  SELECT name, jersey_number, team_id, position, true, false FROM matched
  RETURNING id, team_id, name
)
UPDATE signups s
SET player_id = p.id
FROM placed p, matched m
WHERE p.team_id = m.team_id
  AND p.name = m.name
  AND s.id = m.signup_id;

SELECT t.name AS team, p.name AS player, p.jersey_number, p.is_captain
FROM players p JOIN teams t ON t.id = p.team_id
ORDER BY t.display_order, p.is_captain DESC, p.jersey_number;
