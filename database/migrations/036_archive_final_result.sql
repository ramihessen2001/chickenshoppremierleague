-- ---------------------------------------------------------------------------
-- Archive: the 2025 Winter League final's result
--
-- The final (Saturday 10 January 2026, Knights v Warriors) was archived before
-- its result was entered, so it was stored with no score and status
-- 'scheduled'. It finished Knights 5, Warriors 1.
--
-- Only the score and status are set. No box score was ever recorded for this
-- game, so it still has no scorers or other statistics; those can be added
-- separately if they are known.
--
-- Matched by id, so no other game is touched.
-- ---------------------------------------------------------------------------

UPDATE archive_games
SET home_score = 5,
    away_score = 1,
    status = 'completed'
WHERE id = '1f505e74-44e9-48ae-9a51-820a52cbd36f';   -- Knights v Warriors, final

SELECT g.date, g.playoff_round, h.name AS home, g.home_score, g.away_score, a.name AS away, g.status
FROM archive_games g
JOIN archive_teams h ON h.id = g.home_archive_team_id
JOIN archive_teams a ON a.id = g.away_archive_team_id
WHERE g.id = '1f505e74-44e9-48ae-9a51-820a52cbd36f';
