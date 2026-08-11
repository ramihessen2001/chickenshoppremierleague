-- Insert playoff games into the games table
-- These games will have week_number = 0 to distinguish them from regular season

-- First, get team IDs
-- You'll need to replace these with actual UUIDs from your teams table

-- Play-In Games (Game 100, 101)
INSERT INTO games (
  game_number,
  week_number,
  date,
  time,
  location,
  home_team_id,
  away_team_id,
  home_score,
  away_score,
  status,
  playoff_round
) VALUES
-- Game 100: Eagles vs Warriors
(
  100,
  0,
  '2026-01-04',
  '8:00 PM',
  'ICNEF',
  (SELECT id FROM teams WHERE slug = 'eagles'),
  (SELECT id FROM teams WHERE slug = 'warriors'),
  NULL,
  NULL,
  'scheduled',
  'play-in'
),
-- Game 101: Lions vs Dolphins
(
  101,
  0,
  '2026-01-04',
  '9:15 PM',
  'ICNEF',
  (SELECT id FROM teams WHERE slug = 'lions'),
  (SELECT id FROM teams WHERE slug = 'dolphins'),
  NULL,
  NULL,
  'scheduled',
  'play-in'
),
-- Game 102: Knights vs TBD (placeholder: eagles, will be updated after play-in)
(
  102,
  0,
  '2026-01-09',
  '8:00 PM',
  'ICNEF',
  (SELECT id FROM teams WHERE slug = 'knights'),
  (SELECT id FROM teams WHERE slug = 'eagles'), -- Placeholder - will be updated after play-in games
  NULL,
  NULL,
  'scheduled',
  'semifinal'
),
-- Game 103: Panthers vs TBD (placeholder: lions, will be updated after play-in)
(
  103,
  0,
  '2026-01-09',
  '9:15 PM',
  'ICNEF',
  (SELECT id FROM teams WHERE slug = 'panthers'),
  (SELECT id FROM teams WHERE slug = 'lions'), -- Placeholder - will be updated after play-in games
  NULL,
  NULL,
  'scheduled',
  'semifinal'
)
ON CONFLICT (id) DO NOTHING;

