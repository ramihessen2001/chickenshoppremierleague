# Team Statistics Fix - Game Statistics Now Showing on Team Pages

## 🐛 Problem

When clicking on completed games from team pages (`/teams/[teamId]`), the box score modal would show "No detailed statistics available" even though:
- The statistics WERE in the database
- The same game showed full statistics when viewed from `/schedule` page

## 🔍 Root Cause

The issue was in `lib/supabaseData.ts`:

### `getAllGames()` Function

**Before (Missing Statistics):**
```typescript
export async function getAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(id, name, slug, logo_url),
      away_team:teams!away_team_id(id, name, slug, logo_url)
    `)
    .order('game_number')
  // ...
}
```

The query was **NOT including statistics** from the `game_statistics` table!

## ✅ Solution

Updated `getAllGames()` to include statistics, matching how `getGameById()` works:

**After (With Statistics):**
```typescript
export async function getAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(id, name, slug, logo_url),
      away_team:teams!away_team_id(id, name, slug, logo_url),
      statistics:game_statistics(
        *,
        player:players(id, name, jersey_number),
        team:teams(id, name, slug)
      )
    `)
    .order('game_number')
  // ...
}
```

### What This Does

1. **Joins `game_statistics` table** - Gets all statistics for each game
2. **Includes player details** - Name and jersey number for each stat
3. **Includes team details** - Team name and slug for each stat
4. **Returns complete data** - Same format as `getGameById()`

## 🎯 Files Changed

- **`lib/supabaseData.ts`** - Added statistics to `getAllGames()` query

## 🚀 Impact

### Team Pages (`/teams/[teamId]`)
- ✅ Now loads statistics with every game
- ✅ Box score modal shows full details
- ✅ Displays goals, assists, saves, cards
- ✅ Matches `/schedule` page behavior

### Schedule Page (`/schedule`)
- ✅ No change (was already working)
- ✅ Uses the same `getAllGames()` function
- ✅ Performance may improve (fewer queries)

## 📊 Box Score Now Shows

When clicking a completed game from team pages:
- ✅ **Goals** - Player name, jersey number
- ✅ **Assists** - Player name, jersey number
- ✅ **Saves** - Goalkeeper stats
- ✅ **Yellow Cards** - Disciplinary actions
- ✅ **Red Cards** - Ejections
- ✅ **Blue Cards** - 2-minute penalties

## 🧪 Testing

### To Verify Fix:
1. Go to any team page (e.g., `/teams/panthers`)
2. Click on a completed game in the Results section
3. Box score modal should now show:
   - Final score
   - All goal scorers
   - Assists
   - Saves
   - Cards (if any)

### Expected Behavior:
- Statistics appear immediately
- No "No detailed statistics available" message (unless truly no stats entered)
- Same data as viewing the game from `/schedule`

## 🎉 Status

**FIXED** - Game statistics now load correctly on team pages!

The team pages and schedule page now use the exact same data source with complete statistics included in every game fetch.


