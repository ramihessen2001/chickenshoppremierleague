-- ---------------------------------------------------------------------------
-- Every remaining game moves to Isha'a
--
-- All scheduled games from Sat 31 Oct onward (matchweeks 3-5, 16 games) are
-- set to the Isha'a slot. Dates and matchweeks do not change, so no club
-- moves to a different day.
--
-- Note: each game day has two games, so both now share the Isha'a slot.
--
-- The two postponed Week 6 games (Date TBD) are left alone; set their slot
-- when they are given a new date. Safe to run twice.
-- ---------------------------------------------------------------------------

UPDATE games
SET time = 'Isha''a', updated_at = NOW()
WHERE date >= '2026-10-31'
  AND status = 'scheduled'
  AND time <> 'Isha''a';

SELECT g.date, g.time, h.name AS home, a.name AS away, g.status
FROM games g
JOIN teams h ON h.id = g.home_team_id
JOIN teams a ON a.id = g.away_team_id
WHERE g.date >= '2026-10-31'
ORDER BY g.date, g.game_number;
