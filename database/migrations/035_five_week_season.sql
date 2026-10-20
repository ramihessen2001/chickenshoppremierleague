-- ---------------------------------------------------------------------------
-- A five-week regular season
--
-- The shortened season runs Matchweeks 1-5; there is no Week 6. The schedule
-- page draws weeks 1..total_weeks, so this removes Week 6 from it, and the
-- admin's week controls now stop at 5.
--
-- The two games that were in Week 6 (S.C Paris v CSCP, S.C Cairo v S.C Dakar)
-- are postponed by migration 033 and appear in the schedule's "To be
-- rescheduled" section instead. They keep week_number 6 in the database only
-- because a game with no week is read as a playoff game; nothing shows it.
-- When one is rescheduled, give it its new date, slot and week (2-5) and set
-- its status back to scheduled.
--
-- Run 033 as well (in either order) -- without it those two games are still
-- 'scheduled' in Week 6 and would drop off the schedule page entirely.
-- ---------------------------------------------------------------------------

UPDATE league_config SET total_weeks = 5;

SELECT season, total_weeks, current_week, phase FROM league_config;
