# Playoff Games - Supabase Setup Guide

## Overview
Playoff games are now stored in Supabase alongside regular season games, enabling full functionality including Man of The Match selection, statistics tracking, and more.

## Database Setup

### Step 1: Run the Migration
Execute the migration to add playoff support:

```sql
-- Run this in Supabase SQL Editor
-- File: database/migrations/add_playoff_games.sql

ALTER TABLE games
ADD COLUMN IF NOT EXISTS playoff_round TEXT;

COMMENT ON COLUMN games.playoff_round IS 'Playoff round identifier: play-in, semifinal, final';

CREATE INDEX IF NOT EXISTS idx_games_playoff ON games(week_number) WHERE week_number = 0;
```

### Step 2: Fix NOT NULL Constraint (Optional)
If you want true TBD opponents (NULL away_team_id), run this first:

```sql
-- Run this in Supabase SQL Editor
-- File: database/fix_playoff_tbd.sql

ALTER TABLE games
ALTER COLUMN away_team_id DROP NOT NULL;
```

**OR** use the placeholder approach (recommended) - semifinal games will have placeholder teams that you'll update after play-in games complete.

### Step 3: Insert Playoff Games
Insert the initial playoff games:

```sql
-- Run this in Supabase SQL Editor
-- File: database/insert_playoff_games.sql

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
-- Game 100: Eagles vs Warriors (Play-In)
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
-- Game 101: Lions vs Dolphins (Play-In)
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
-- Game 102: Knights vs TBD (Semifinal - using placeholder)
(
  102,
  0,
  '2026-01-09',
  '8:00 PM',
  'ICNEF',
  (SELECT id FROM teams WHERE slug = 'knights'),
  (SELECT id FROM teams WHERE slug = 'eagles'), -- Placeholder
  NULL,
  NULL,
  'scheduled',
  'semifinal'
),
-- Game 103: Panthers vs TBD (Semifinal - using placeholder)
(
  103,
  0,
  '2026-01-09',
  '9:15 PM',
  'ICNEF',
  (SELECT id FROM teams WHERE slug = 'panthers'),
  (SELECT id FROM teams WHERE slug = 'lions'), -- Placeholder
  NULL,
  NULL,
  'scheduled',
  'semifinal'
)
ON CONFLICT (id) DO NOTHING;
```

## How It Works

### Playoff Game Identification
- **week_number = 0**: Distinguishes playoff games from regular season
- **game_number >= 100**: Playoff games use game numbers 100+
- **playoff_round**: 'play-in', 'semifinal', or 'final'

### Features Available
- ✅ Full EditBoxScoreModal with statistics
- ✅ Man of The Match selection (Puro Player)
- ✅ Goals, Assists, Saves, Cards tracking
- ✅ Real-time updates
- ✅ Automatic winner detection
- ✅ Green highlight for winning team

### Data Flow
1. **Load**: `PlayoffBracket` fetches games where `week_number = 0`
2. **Edit**: Admin clicks pencil icon → `EditBoxScoreModal` opens
3. **Save**: Scores and statistics saved to Supabase
4. **Refresh**: Bracket automatically reloads updated data

## Updating TBD Teams

After play-in games are complete, update the semifinal matchups:

```sql
-- Update semifinal game with lower seed winner
UPDATE games
SET away_team_id = (SELECT id FROM teams WHERE slug = 'WINNER_SLUG')
WHERE game_number = 102;

-- Update semifinal game with higher seed winner
UPDATE games
SET away_team_id = (SELECT id FROM teams WHERE slug = 'WINNER_SLUG')
WHERE game_number = 103;
```

## Adding Championship Game

To add a championship final game:

```sql
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
  '2026-01-XX',
  'X:XX PM',
  'ICNEF',
  NULL, -- TBD from semifinal
  NULL, -- TBD from semifinal
  NULL,
  NULL,
  'scheduled',
  'final'
);
```

## Troubleshooting

### Playoff games not showing?
- Check that `week_number = 0` in database
- Verify team slugs match: 'eagles', 'warriors', 'lions', 'dolphins', 'knights', 'panthers'
- Check browser console for errors

### Man of The Match not working?
- Ensure `player_of_game_id` column exists in `games` table
- Check RLS policies allow updates to `games` table
- Verify players exist in `players` table for both teams

### Statistics not saving?
- Check `game_statistics` table RLS policies
- Verify team UUIDs are correct in database
- Check browser console for detailed errors

## Files Modified
- `/app/components/PlayoffBracket.tsx` - Now fetches from Supabase
- `/app/components/EditBoxScoreModal.tsx` - Unified save logic for all games
- `/database/migrations/add_playoff_games.sql` - Database schema
- `/database/insert_playoff_games.sql` - Initial data

## Benefits of Supabase Storage
1. **Persistent**: Data survives browser refresh/clear
2. **Shareable**: All admins see same data
3. **Full Features**: Man of The Match, statistics, etc.
4. **Consistent**: Same editing experience as regular season
5. **Scalable**: Easy to add more playoff rounds

