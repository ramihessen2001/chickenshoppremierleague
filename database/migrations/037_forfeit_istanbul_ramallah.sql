-- ---------------------------------------------------------------------------
-- Forfeits and points decisions, and S.C Istanbul v S.C Ramallah (Matchweek 3)
--
-- forfeited_by: the club that forfeited. A forfeit is recorded as a 3-0 result
-- for the other club and shows as "Forfeit" on the schedule. On its own it
-- earns the usual points (3 / 0).
--
-- home_points_override / away_points_override: points the league awarded by
-- special decision, in place of what the score earns. Null (the default) means
-- the usual points. See lib/standings.ts.
--
-- S.C Ramallah forfeited Friday 30 October (Maghrib) to S.C Istanbul, the
-- home side: 3-0 to Istanbul. By the league's decision for this game only,
-- Istanbul get 2 points and Ramallah lose 1.
--
-- Safe to run twice.
-- ---------------------------------------------------------------------------

ALTER TABLE games
  ADD COLUMN IF NOT EXISTS forfeited_by UUID REFERENCES teams(id),
  ADD COLUMN IF NOT EXISTS home_points_override INTEGER,
  ADD COLUMN IF NOT EXISTS away_points_override INTEGER;

UPDATE games
SET home_score = 3,
    away_score = 0,
    status = 'completed',
    forfeited_by = away_team_id,
    home_points_override = 2,
    away_points_override = -1
WHERE id = 'f2929bdf-5e2b-45f2-908a-9b93f020f9fe';

SELECT g.week_number, g.date, g.time, h.name AS home, g.home_score, g.away_score, a.name AS away,
       g.status, f.name AS forfeited_by, g.home_points_override, g.away_points_override
FROM games g
JOIN teams h ON h.id = g.home_team_id
JOIN teams a ON a.id = g.away_team_id
LEFT JOIN teams f ON f.id = g.forfeited_by
WHERE g.id = 'f2929bdf-5e2b-45f2-908a-9b93f020f9fe';
