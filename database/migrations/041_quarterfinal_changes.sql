-- ---------------------------------------------------------------------------
-- Playoff quarterfinals: one moved, two to be rescheduled
--
-- S.C Dakar v S.C Paris moves from Friday 20 November to Saturday 21 November
-- at 8:00 PM, the slot S.C Kabul v S.C Istanbul leaves.
--
-- S.C Kabul v S.C Istanbul and S.C Cairo v CSCP are postponed: the site shows
-- "Date TBD" for them until they get a new date. Their stored date and time
-- are kept; to reschedule one, set its new date and time (admin Edit game)
-- and put its status back to scheduled.
--
-- S.C Mansoura v S.C Ramallah (Saturday 21 November, 9:00 PM) is unchanged.
-- Only games still scheduled are touched, so this is safe to run twice.
-- ---------------------------------------------------------------------------

UPDATE games
SET date = '2026-11-21',
    time = '8:00 PM',
    updated_at = NOW()
WHERE id = '2fbb2ce7-1225-4723-ba65-f865bdd8c51e' -- S.C Dakar v S.C Paris
  AND status = 'scheduled';

UPDATE games
SET status = 'postponed',
    updated_at = NOW()
WHERE id IN (
    '89d3f823-23f0-41d4-9172-569cd0615357', -- S.C Kabul v S.C Istanbul
    '9617fa6e-cdf6-485d-bec6-0b4b54522d3e'  -- S.C Cairo v CSCP
  )
  AND status = 'scheduled';

SELECT g.game_number, g.playoff_round, g.date, g.time, h.name AS home, a.name AS away, g.status
FROM games g
JOIN teams h ON h.id = g.home_team_id
JOIN teams a ON a.id = g.away_team_id
WHERE g.is_playoff
ORDER BY g.game_number;
