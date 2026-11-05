-- ---------------------------------------------------------------------------
-- S.C Istanbul v S.C Ramallah (Matchweek 3): points decision withdrawn
--
-- Migration 037 gave this forfeit special points: 2 to Istanbul and minus 1
-- to Ramallah. The league has withdrawn that, so the game now earns the usual
-- points for its 3-0 result: 3 to Istanbul, 0 to Ramallah. That leaves
-- Istanbul on 3 points and Ramallah on 4.
--
-- It is still recorded as a forfeit by Ramallah (forfeited_by), so the
-- schedule keeps showing "Forfeit". Safe to run twice.
-- ---------------------------------------------------------------------------

UPDATE games
SET home_points_override = NULL,
    away_points_override = NULL
WHERE id = 'f2929bdf-5e2b-45f2-908a-9b93f020f9fe';

SELECT g.week_number, g.date, h.name AS home, g.home_score, g.away_score, a.name AS away,
       f.name AS forfeited_by, g.home_points_override, g.away_points_override
FROM games g
JOIN teams h ON h.id = g.home_team_id
JOIN teams a ON a.id = g.away_team_id
LEFT JOIN teams f ON f.id = g.forfeited_by
WHERE g.id = 'f2929bdf-5e2b-45f2-908a-9b93f020f9fe';
