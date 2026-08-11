# Puro Man of The Match Feature

## 🎯 Overview

The "Puro Man of The Match" feature allows admins to select a standout player from each completed game. The selected player will be highlighted with the Puro logo throughout the app.

## ✨ Features

### For Admins:
- **Select Man of The Match** from the Edit Box Score modal
- Choose from all players who participated in the game
- Selection saves automatically to the database
- Can change or remove selection at any time

### For Users:
- **Puro Logo Badge** next to the selected player's name in box scores
- **Gold Trophy Icon** highlighting the player
- **Special Styling** to make the player stand out

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
-- Add player_of_game_id column to games table
ALTER TABLE games
ADD COLUMN player_of_game_id UUID REFERENCES players(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_games_player_of_game ON games(player_of_game_id);

COMMENT ON COLUMN games.player_of_game_id IS 'ID of the player selected as Puro Man of The Match';
```

### Step 2: Update RLS Policies (If Needed)

If you have restrictive RLS policies, make sure they allow updates to the `player_of_game_id` column:

```sql
-- Ensure public can update games (including player_of_game_id)
-- Note: Your app controls admin access at the UI level
CREATE POLICY IF NOT EXISTS "Allow public updates to games"
ON games FOR UPDATE
USING (true)
WITH CHECK (true);
```

### Step 3: Restart Dev Server

The code changes are already in place. Just restart your server:

```bash
npm run dev
```

## 📖 How to Use

### For Admins:

1. **Login as admin** (enter admin password in the admin banner)
2. **Navigate to any completed game**:
   - From homepage → click a game card
   - From `/schedule` → click a game
   - From team pages → click a completed game
3. **Click the Edit button** (pencil icon) to open Edit Box Score
4. **Scroll down** to the "Puro Man of The Match" section
5. **Select a player** from the dropdown
6. Selection saves automatically!

### What Users See:

When a player is selected as Man of The Match, they will be displayed with:
- 🏆 **Puro Logo** (circular badge)
- ⭐ **Gold Trophy Icon**
- 🌟 **Gold Text Color** for their name

This appears in:
- Box score modals
- Game statistics
- Any view that shows game details

## 🎨 Visual Design

### Man of The Match Display:

```
┌─────────────────────────────────────┐
│  [Puro Logo] #10 John Smith 🏆     │
│     (gold colored text)             │
└─────────────────────────────────────┘
```

### Admin Selector:

```
┌──────────────────────────────────────┐
│  [Puro Logo]                         │
│  🏆 Puro Man of The Match          │
│  Select the standout player...       │
│                                      │
│  [Dropdown with all players]         │
│  -- No Player Selected --            │
│  #10 John Smith (Forward)            │
│  #7 Jane Doe (Midfielder)            │
│  #1 Bob Wilson (Goalkeeper)          │
│  ...                                 │
└──────────────────────────────────────┘
```

## 📂 Files Created/Modified

### New Files:
- `public/images/puro_logo.png` - Puro logo image
- `app/components/PlayerOfGameSelector.tsx` - Admin selector component
- `app/components/PuroPlayerBadge.tsx` - Display badge component
- `database/migrations/add_player_of_game.sql` - Database migration

### Modified Files:
- `types/game.ts` - Added `playerOfGameId` and `playerOfGame` fields
- `lib/supabaseData.ts` - Updated to fetch player of game data
- `app/components/EditBoxScoreModal.tsx` - Added player selector
- `app/components/StatCategory.tsx` - Display Puro badge
- `app/components/GameStatistics.tsx` - Pass player ID to categories

## 🗄️ Database Schema

### New Column: `games.player_of_game_id`

```sql
player_of_game_id UUID REFERENCES players(id) ON DELETE SET NULL
```

**Properties:**
- **Type**: UUID
- **Nullable**: Yes (NULL if no player selected)
- **Foreign Key**: References `players(id)`
- **On Delete**: SET NULL (preserves game if player is deleted)

## 🔄 Data Flow

1. **Admin selects player**:
   - PlayerOfGameSelector component
   - Updates `games.player_of_game_id` in database
   - Dispatches `dataUpdated` event

2. **Data fetching**:
   - `getAllGames()` and `getGameById()` fetch player data
   - Includes JOIN with `players` table
   - Transforms to local `Game` type with `playerOfGame` object

3. **Display**:
   - GameStatistics passes `playerOfGameId` to StatCategory
   - StatCategory checks each player against `playerOfGameId`
   - PuroPlayerBadge renders logo/trophy if match

## 🎯 Examples

### Selecting Player of Game:

```typescript
// In EditBoxScoreModal
<PlayerOfGameSelector
  game={game}
  onPlayerSelected={(playerId) => {
    console.log('Player selected:', playerId)
  }}
/>
```

### Displaying Puro Badge:

```typescript
// In StatCategory
<PuroPlayerBadge
  playerName="John Smith"
  jerseyNumber={10}
  isPlayerOfGame={stat.playerId === playerOfGameId}
/>
```

## 🚨 Troubleshooting

### Player selector not showing
- ✅ Make sure you're logged in as admin
- ✅ Check that the game is completed (has scores)
- ✅ Verify players exist for both teams

### Player selection not saving
- ✅ Run the database migration
- ✅ Check RLS policies on `games` table
- ✅ Check browser console for errors

### Puro logo not displaying
- ✅ Verify `public/images/puro_logo.png` exists
- ✅ Check Next.js dev server is running
- ✅ Hard refresh browser (Cmd+Shift+R)

### Player badge not showing gold color
- ✅ Verify `playerOfGameId` is being passed to StatCategory
- ✅ Check that player IDs match exactly
- ✅ Inspect element to see if styling is applied

## 📊 Future Enhancements

Potential additions for the future:
- 📊 **Player of Game History** - Track all-time winners
- 🏆 **Leaderboard** - Most "Player of Game" awards
- 📱 **Push Notifications** - Alert when player is selected
- 🎨 **Custom Badges** - Different logos for different achievements
- 📸 **Player Photos** - Show player photo with badge

## ✅ Testing Checklist

- [ ] Database migration ran successfully
- [ ] Player selector appears in Edit Box Score modal (admin only)
- [ ] Can select a player from dropdown
- [ ] Selection saves to database
- [ ] Puro logo displays next to player name in box score
- [ ] Gold trophy icon shows next to player name
- [ ] Player name is gold colored when selected
- [ ] Can change player selection
- [ ] Can clear selection (set to "No Player Selected")
- [ ] Badge displays in all game views (homepage, schedule, team pages)
- [ ] Non-admins cannot see the selector
- [ ] Non-admins CAN see the badge on selected players

## 🎉 Status

**✅ COMPLETE** - Puro Man of The Match feature is fully implemented and ready to use!

Admins can now recognize outstanding performances by selecting a Man of The Match, and that player will be highlighted with the prestigious Puro logo throughout the application.

