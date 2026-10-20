-- ---------------------------------------------------------------------------
-- Week 6: to be rescheduled
--
-- The shortened season has no Week 6, so its two games (S.C Paris v CSCP and
-- S.C Cairo v S.C Dakar, stored for Saturday 21 November) are waiting for new
-- dates. Marking them postponed makes the site show "Date TBD" and "To be
-- rescheduled" for them, with Week 6 flagged "Dates TBD" on the schedule.
--
-- Their stored date and slot are kept. To reschedule one, set its new date,
-- slot and week (from the admin Edit game screen) and put its status back to
-- scheduled.
--
-- Only games still scheduled are touched, so this is safe to run twice.
-- ---------------------------------------------------------------------------

UPDATE games
SET status = 'postponed'
WHERE week_number = 6
  AND status = 'scheduled';

SELECT g.week_number, g.date, g.time, h.name AS home, a.name AS away, g.status
FROM games g
JOIN teams h ON h.id = g.home_team_id
JOIN teams a ON a.id = g.away_team_id
WHERE g.week_number = 6
ORDER BY g.date, g.time;
