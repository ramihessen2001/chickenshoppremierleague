-- Fall 2026 reschedule after the Oct 9/10 weekend was cancelled for weather.
-- Week 1 moves to Oct 16/17; Sundays (Nov 1, 8, 15) make up the lost days;
-- the last matchweek is Sat Nov 21. No team plays on consecutive days.
-- Only dates, times and week numbers change -- not who plays whom.

UPDATE games g SET week_number = v.w, date = v.d, time = v.t, updated_at = NOW()
FROM (VALUES
  (1, 1, '2026-10-16'::date, 'Maghrib'),
  (2, 1, '2026-10-17'::date, 'Isha''a'),
  (3, 1, '2026-10-16'::date, 'Isha''a'),
  (4, 1, '2026-10-17'::date, 'Maghrib'),
  (5, 2, '2026-10-23'::date, 'Maghrib'),
  (6, 4, '2026-11-06'::date, 'Maghrib'),
  (7, 4, '2026-11-07'::date, 'Maghrib'),
  (8, 5, '2026-11-14'::date, 'Maghrib'),
  (9, 3, '2026-10-31'::date, 'Maghrib'),
  (10, 3, '2026-10-30'::date, 'Maghrib'),
  (11, 3, '2026-10-30'::date, 'Isha''a'),
  (12, 3, '2026-10-31'::date, 'Isha''a'),
  (13, 5, '2026-11-13'::date, 'Maghrib'),
  (14, 2, '2026-10-23'::date, 'Isha''a'),
  (15, 4, '2026-11-06'::date, 'Isha''a'),
  (16, 2, '2026-10-24'::date, 'Maghrib'),
  (17, 4, '2026-11-07'::date, 'Isha''a'),
  (18, 2, '2026-10-24'::date, 'Isha''a'),
  (19, 5, '2026-11-13'::date, 'Isha''a'),
  (20, 5, '2026-11-14'::date, 'Isha''a'),
  (21, 6, '2026-11-21'::date, 'Maghrib'),
  (22, 6, '2026-11-21'::date, 'Isha''a'),
  (23, 3, '2026-11-01'::date, 'Maghrib'),
  (24, 4, '2026-11-08'::date, 'Maghrib'),
  (25, 5, '2026-11-15'::date, 'Maghrib'),
  (26, 4, '2026-11-08'::date, 'Isha''a'),
  (27, 3, '2026-11-01'::date, 'Isha''a'),
  (28, 5, '2026-11-15'::date, 'Isha''a')
) AS v(n, w, d, t)
WHERE g.game_number = v.n;

-- end_date stays 2026-11-28. The new layout has 6 weekends, not 7.
UPDATE league_config SET total_weeks = 6;
