-- ---------------------------------------------------------------------------
-- Matchweek 2: Cairo v Mansoura and Dakar v Kabul swap places
--
--   S.C Cairo v S.C Mansoura  Sat 24 Oct Maghrib -> Fri 23 Oct Isha'a
--   S.C Dakar v S.C Kabul     Fri 23 Oct Isha'a  -> Sat 24 Oct Maghrib
--
-- Matchweek 2 after the swap:
--   Fri 23 Oct  Maghrib  S.C Istanbul Black v CSCP
--   Fri 23 Oct  Isha'a   S.C Cairo v S.C Mansoura
--   Sat 24 Oct  Maghrib  S.C Dakar v S.C Kabul
--   Sat 24 Oct  Isha'a   S.C Ramallah v S.C Paris
--
-- Checked against the whole season: no two games share a slot, and no club
-- plays two days in a row. The games are matched by id, so nothing else moves.
-- ---------------------------------------------------------------------------

UPDATE games
SET date = '2026-10-23', time = 'Isha''a'
WHERE id = 'a07d6e41-75d5-46c4-b511-966d2df316f2';   -- S.C Cairo v S.C Mansoura

UPDATE games
SET date = '2026-10-24', time = 'Maghrib'
WHERE id = '6bb9658f-28ea-4907-ad0d-733572638f1f';   -- S.C Dakar v S.C Kabul

SELECT g.date, g.time, h.name AS home, a.name AS away, g.status
FROM games g
JOIN teams h ON h.id = g.home_team_id
JOIN teams a ON a.id = g.away_team_id
WHERE g.week_number = 2
ORDER BY g.date, g.time DESC;
