-- Add Jibreel Wood to Warriors team with jersey #3

-- First, get the Warriors team ID (you'll need this)
-- Run this query first to find the Warriors team UUID:
SELECT id, name FROM teams WHERE name = 'Warriors';

-- Then use that ID in the INSERT below
-- Replace 'WARRIORS_TEAM_ID_HERE' with the actual UUID from the query above

INSERT INTO players (name, jersey_number, team_id, is_active)
VALUES (
  'Jibreel Wood',
  3,
  (SELECT id FROM teams WHERE name = 'Warriors'),
  true
);

-- Verify the player was added
SELECT 
  p.name,
  p.jersey_number,
  t.name as team_name,
  p.is_active
FROM players p
JOIN teams t ON p.team_id = t.id
WHERE p.name = 'Jibreel Wood';

