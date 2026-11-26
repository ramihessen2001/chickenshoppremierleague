-- ---------------------------------------------------------------------------
-- Quarterfinal: S.C Kabul 5-3 S.C Istanbul Black (game 100)
--
-- The recorded score was 5-2. Istanbul Black's third goal was scored by
-- "Lorenzo", a one-off player who is not on any roster, so he could not be
-- added in the box score editor. He gets a player row for this game only:
-- is_active = false keeps him off the roster, the draft and the player list,
-- while his goal and assist still attach to Istanbul Black and the game.
--
-- Safe to run once; the player insert is skipped if Lorenzo already exists.
-- ---------------------------------------------------------------------------

UPDATE games
SET home_score = 5, away_score = 3, updated_at = NOW()
WHERE game_number = 100 AND is_playoff = TRUE;

INSERT INTO players (name, team_id, is_active, position)
SELECT 'Lorenzo', '2cba13a2-f70d-425f-94c1-30226d0cf9ac', FALSE, 'Any'
WHERE NOT EXISTS (
  SELECT 1 FROM players
  WHERE name = 'Lorenzo' AND team_id = '2cba13a2-f70d-425f-94c1-30226d0cf9ac'
);

INSERT INTO game_statistics (game_id, player_id, team_id, stat_type, count)
SELECT '89d3f823-23f0-41d4-9172-569cd0615357', p.id, p.team_id, s.stat_type, 1
FROM players p
CROSS JOIN (VALUES ('goal'), ('assist')) AS s(stat_type)
WHERE p.name = 'Lorenzo' AND p.team_id = '2cba13a2-f70d-425f-94c1-30226d0cf9ac'
  AND NOT EXISTS (
    SELECT 1 FROM game_statistics gs
    WHERE gs.game_id = '89d3f823-23f0-41d4-9172-569cd0615357'
      AND gs.player_id = p.id AND gs.stat_type = s.stat_type
  );

SELECT g.home_score, g.away_score, p.name, gs.stat_type, gs.count
FROM games g
LEFT JOIN game_statistics gs ON gs.game_id = g.id
LEFT JOIN players p ON p.id = gs.player_id
WHERE g.game_number = 100 AND g.is_playoff = TRUE
ORDER BY gs.team_id, gs.stat_type, p.name;
