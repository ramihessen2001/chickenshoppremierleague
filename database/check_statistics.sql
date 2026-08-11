-- Check game statistics for the Panthers vs Eagles game on Dec 25, 2025
-- This query will show all statistics with their counts

SELECT 
  gs.id,
  gs.stat_type,
  gs.count,
  p.name as player_name,
  p.jersey_number,
  t.name as team_name,
  g.date,
  g.home_score,
  g.away_score
FROM game_statistics gs
JOIN players p ON gs.player_id = p.id
JOIN teams t ON gs.team_id = t.id
JOIN games g ON gs.game_id = g.id
WHERE g.date = '2025-12-25'
ORDER BY t.name, gs.stat_type, p.name;

-- If you find Abdollah Achabak has count=9 instead of count=3, run this to fix it:
/*
UPDATE game_statistics
SET count = 3
WHERE player_id = (SELECT id FROM players WHERE name = 'Abdollah Achabak')
  AND game_id = (SELECT id FROM games WHERE date = '2025-12-25')
  AND stat_type = 'goal';
*/




