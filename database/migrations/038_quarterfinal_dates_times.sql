-- ---------------------------------------------------------------------------
-- Quarterfinal dates and times
--
--   Fri 20 Nov  8:00 PM  S.C Dakar v S.C Paris                  (3 v 6)
--   Fri 20 Nov  9:00 PM  S.C Cairo v Central Sporting Club Of PURO (2 v 7)
--   Sat 21 Nov  8:00 PM  S.C Kabul v S.C Istanbul Black         (1 v 8)
--   Sat 21 Nov  9:00 PM  S.C Mansoura v S.C Ramallah            (4 v 5)
--
-- The generator stamped all four with the day they were created and
-- 6:00 PM. Games are matched by id, so nothing else moves.
-- ---------------------------------------------------------------------------

UPDATE games SET date = '2026-11-20', time = '8:00 PM', updated_at = NOW()
WHERE id = '2fbb2ce7-1225-4723-ba65-f865bdd8c51e';   -- Dakar v Paris

UPDATE games SET date = '2026-11-20', time = '9:00 PM', updated_at = NOW()
WHERE id = '9617fa6e-cdf6-485d-bec6-0b4b54522d3e';   -- Cairo v CSCP

UPDATE games SET date = '2026-11-21', time = '8:00 PM', updated_at = NOW()
WHERE id = '89d3f823-23f0-41d4-9172-569cd0615357';   -- Kabul v Istanbul Black

UPDATE games SET date = '2026-11-21', time = '9:00 PM', updated_at = NOW()
WHERE id = 'a5f594e7-0329-4d25-b905-e88766384426';   -- Mansoura v Ramallah

SELECT g.date, g.time, h.name AS home, a.name AS away
FROM games g
JOIN teams h ON h.id = g.home_team_id
JOIN teams a ON a.id = g.away_team_id
WHERE g.playoff_round = 'quarterfinal'
ORDER BY g.date, g.time;
