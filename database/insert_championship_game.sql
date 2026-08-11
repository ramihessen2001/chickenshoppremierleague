-- Championship Game: Knights vs Warriors
-- The EPIC FINAL GAME of the season
-- Run this in Supabase SQL Editor

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
) VALUES (
  104,
  0,
  '2026-01-10',
  '8:45 PM',
  'ICNEF FIELD',
  (SELECT id FROM teams WHERE slug = 'knights'),
  (SELECT id FROM teams WHERE slug = 'warriors'),
  NULL,
  NULL,
  'scheduled',
  'final'
)
ON CONFLICT (game_number) DO UPDATE SET
  date = '2026-01-10',
  time = '8:45 PM',
  location = 'ICNEF FIELD',
  status = 'scheduled';

