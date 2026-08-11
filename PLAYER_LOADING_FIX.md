# ✅ Fixed: "No active players found for either team" Error

## Problem
When trying to edit game scores from the homepage, you were getting the error:
```
No active players found for either team
```

## Root Cause
The issue was a mismatch between team ID formats:

1. **Games** use slug-based team IDs (`'eagles'`, `'panthers'`, etc.) for compatibility with existing components
2. **Players from Supabase** had UUID team IDs (`'abc-123-def-456'`)
3. When filtering players by team, the slugs didn't match the UUIDs, so no players were found

## Solution
Updated the data transformation layer to handle both formats:

### 1. Updated `getAllPlayers()` in `lib/supabaseData.ts`
- Now returns players with **both** slug (for filtering) and UUID (for saving)
- `teamId` = slug (for compatibility with game.homeTeamId/awayTeamId)
- `teamUUID` = actual database UUID (for saving statistics)

```typescript
export async function getAllPlayers(): Promise<(Player & { teamUUID?: string })[]> {
  // ... fetch from Supabase ...
  
  return (data || []).map(player => ({
    id: player.id,
    name: player.name,
    jerseyNumber: player.jersey_number,
    teamId: player.team?.slug || player.team_id, // Slug for filtering
    teamUUID: player.team?.id || player.team_id, // UUID for saving
    isActive: player.is_active,
    createdAt: player.created_at,
    updatedAt: player.updated_at
  }))
}
```

### 2. Updated `transformGame()` in `lib/supabaseData.ts`
- Now stores both slug and UUID for teams
- `homeTeamId/awayTeamId` = slugs (for display)
- `homeTeamUUID/awayTeamUUID` = UUIDs (for saving statistics)

```typescript
function transformGame(supabaseGame: any): Game & { homeTeamUUID?: string; awayTeamUUID?: string } {
  return {
    // ... other fields ...
    homeTeamId: supabaseGame.home_team?.slug || '',
    awayTeamId: supabaseGame.away_team?.slug || '',
    homeTeamUUID: supabaseGame.home_team?.id, // Store UUID for saving
    awayTeamUUID: supabaseGame.away_team?.id, // Store UUID for saving
    // ... other fields ...
  }
}
```

### 3. Updated `EditBoxScoreModal` save function
- When saving statistics, converts team slug back to UUID
- Looks up the player to get their `teamUUID`
- Uses UUID when calling `upsertGameStatistic()`

```typescript
for (const stat of statistics) {
  // Find the player to get their team UUID
  const player = allPlayers.find(p => p.id === stat.playerId)
  const teamUUID = player?.teamUUID || stat.teamId
  
  await upsertGameStatistic(
    game.id,
    stat.playerId,
    teamUUID, // Use UUID instead of slug
    stat.type,
    stat.count || 1
  )
}
```

## Result
✅ **Players now load correctly in the Edit Box Score modal**
✅ **Can add statistics without errors**
✅ **Scores auto-calculate from goals**
✅ **Statistics save to Supabase with correct team UUIDs**

## Testing
1. Go to homepage
2. Click ADMIN button and enter password `sport2233`
3. Click the edit (pencil) button on any game
4. ✅ Modal opens with player dropdowns populated
5. Click "Add Statistic"
6. ✅ Statistic added successfully
7. ✅ Score auto-updates if it's a goal
8. Click "Save Changes"
9. ✅ Data saves to Supabase
10. Refresh page
11. ✅ Changes persist

## Files Modified
1. `lib/supabaseData.ts` - Updated `getAllPlayers()` and `transformGame()`
2. `app/components/EditBoxScoreModal.tsx` - Updated save logic to use UUIDs

---

**Status**: ✅ Fixed and tested!

