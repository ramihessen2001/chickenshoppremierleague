# Championship Game Card - Setup Guide

## Overview
The epic Knights vs Warriors championship game card is now fully integrated with the database and editable like all other games!

## 🚀 Setup Steps

### Step 1: Create the Championship Game in Database

Run this SQL in your Supabase SQL Editor:

```sql
-- File: database/insert_championship_game.sql

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
  '10:00 PM',
  'Championship Arena',
  (SELECT id FROM teams WHERE slug = 'knights'),
  (SELECT id FROM teams WHERE slug = 'warriors'),
  NULL,
  NULL,
  'scheduled',
  'final'
)
ON CONFLICT (game_number) DO UPDATE SET
  date = '2026-01-10',
  time = '10:00 PM',
  location = 'Championship Arena',
  status = 'scheduled';
```

### Step 2: Verify Game Created

Check that the game exists:

```sql
SELECT 
  game_number,
  date,
  time,
  location,
  home_team.name as home_team,
  away_team.name as away_team,
  status,
  playoff_round
FROM games
LEFT JOIN teams home_team ON games.home_team_id = home_team.id
LEFT JOIN teams away_team ON games.away_team_id = away_team.id
WHERE game_number = 104;
```

Should return:
- game_number: 104
- date: 2026-01-10
- time: 10:00 PM
- location: Championship Arena
- home_team: Knights
- away_team: Warriors
- status: scheduled
- playoff_round: final

### Step 3: Test the Card

The championship card is now:
- ✅ Displayed on the homepage
- ✅ Above the playoff bracket
- ✅ Clickable for users (opens box score view)
- ✅ Editable for admins (pencil icon)
- ✅ Shows final scores when completed
- ✅ Fully integrated with statistics tracking

## 🎮 Features

### For Users (Public)
- **Click the card** → Opens box score modal
- View game details and statistics
- See final scores when game is completed

### For Admins
- **Click the edit button (pencil icon)** → Opens edit modal
- Enter final scores
- Add player statistics (goals, assists, saves, cards)
- Select Man of The Match (Puro Player)
- Save changes to database

## 🎨 Visual Features

The card includes:
- 🏆 Animated trophies, stars, and flames
- ⚡ Glowing borders and gradient effects
- 👑 Championship crown at top
- 🎯 Team logos with hover animations
- 📊 Hype meter at maximum
- ✨ Epic taglines and hyperbole
- 🔴 Status badges (LIVE, MUST WATCH, EPIC)
- ✅ Final score badge when completed

## 📝 Admin Workflow

### Editing the Championship Game

1. **Login as admin** (password: `sport2233`)
2. **Go to homepage** - See the epic championship card
3. **Click the pencil icon** (top-right of card)
4. **Edit Box Score Modal opens:**
   - Enter home score (Knights)
   - Enter away score (Warriors)
   - Add goal scorers
   - Add assists
   - Add saves
   - Add cards (yellow/red)
   - Select Man of The Match
5. **Click Save**
6. **Card updates** with final score badge
7. **Users can click** to view full box score

### Game States

**Scheduled (Before Game):**
- Shows "TODAY • 10:00 PM"
- No scores displayed
- All hype and decoration

**In Progress:**
- Can update scores in real-time
- Statistics can be added

**Completed:**
- Green "FINAL SCORE" badge appears
- Full box score available
- Man of The Match displayed

## 🔧 Technical Details

### Database
- **Table**: `games`
- **Game Number**: 104
- **Week Number**: 0 (playoff game)
- **Playoff Round**: 'final'
- **Teams**: Knights (home) vs Warriors (away)

### Components
- **ChampionshipGameCard.tsx** - Main epic card
- **EditBoxScoreModal.tsx** - Admin editing
- **BoxScoreModal.tsx** - Public viewing

### Integration
- Fetches real game data from Supabase
- Listens for 'dataUpdated' events
- Auto-refreshes when game is edited
- Fully synchronized with database

## 🎉 Result

You now have an **EPIC** championship game card that:
- 🎨 Looks amazing with tons of decoration
- ⚡ Has awesome animations
- 🔧 Is fully functional and editable
- 📊 Tracks all statistics
- 🏆 Shows final scores
- ✅ Works exactly like other game cards

The championship game is ready for the Knights vs Warriors showdown at 10 PM today! 🔥⚔️👑

