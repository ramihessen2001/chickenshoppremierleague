# Statistics Count Field - How It Works

## What Happened

In your screenshot, Abdollah Achabak shows **×9** instead of **×3** for goals.

## Why This Happened

The "Count" field in the Edit Box Score modal controls **how many times** a statistic occurred. When you see:
- **×9** = There is 1 database record with `count=9`
- **×3** = There is 1 database record with `count=3`

The ×9 display is actually **correct** based on what's in the database - the issue is that the count value of 9 was saved instead of 3.

## How the Count Field Works

When editing statistics in the modal, you'll see three fields per row:

1. **Player** - Who performed the action
2. **Stat Type** - What action (Goal, Assist, Save, etc.)
3. **Count** - How many times (defaults to 1)

### Examples:

**Scenario 1:** Player scored 3 goals
- **Option A:** Add 1 statistic with count=3
  - Result: 1 row in the UI, 1 database record, displays as "Player Name #27 ×3"
  
- **Option B:** Add 3 statistics with count=1 each
  - Result: 3 rows in the UI, 3 database records, displays as 3 separate lines (no ×3)

**Both options are valid!** The total score is calculated correctly either way.

## How to Fix Your Current Data

### Option 1: Fix via Admin UI (Easiest)
1. Go to http://localhost:3000 (or your deployed site)
2. Enter admin password (`sport2233`)
3. Click on the Panthers vs Eagles game (Dec 25, 2025)
4. Click "Edit Box Score"
5. Find Abdollah Achabak's goal statistic
6. Change the **Count** field from `9` to `3`
7. Click "Save Box Score"

### Option 2: Fix via SQL (Direct Database)
1. Go to Supabase Dashboard → SQL Editor
2. Run the query from `database/check_statistics.sql` to verify the issue
3. Run this update query:

```sql
UPDATE game_statistics
SET count = 3
WHERE player_id = (SELECT id FROM players WHERE name = 'Abdollah Achabak')
  AND game_id = (SELECT id FROM games WHERE date = '2025-12-25')
  AND stat_type = 'goal';
```

4. Refresh your app to see the change

## UI Improvements Added

I've just added:
1. **Column headers** above the statistics list showing "Player", "Stat Type", "Count"
2. **Tooltip** on the count field: "Count (e.g., 2 if player scored 2 goals)"
3. **Placeholder** text in the count field

These changes will make it clearer how the count field works in the future.

## Score Calculation

The final score is calculated by **summing up all goal counts**:
- If you have 1 statistic with count=9 → Score = 9
- If you have 1 statistic with count=3 → Score = 3
- If you have 3 statistics with count=1 each → Score = 3

So if the displayed score is 3-0, but you see ×9, that means:
1. The database has count=9
2. The score display is showing something else (or was manually entered)
3. You need to fix the count to match the actual score

## Best Practice

For consistency, I recommend:
- **Use count=1 and add multiple rows** if you want to track each goal separately (e.g., for timestamps)
- **Use count > 1 in a single row** if you just want a total count and don't need individual goal details




