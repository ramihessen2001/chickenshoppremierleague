# Update Current Week (Today's Games)

## Problem
The homepage is showing "Day 1" games, but you want it to show the games for the current day.

## Solution
The homepage displays games based on the `current_week` field in the `league_config` table in Supabase.

### Steps to Update:

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project
   - Click on "SQL Editor" in the left sidebar

2. **Run this query to check current setting:**
   ```sql
   SELECT * FROM league_config;
   ```

3. **Update to the day you want to display:**
   ```sql
   UPDATE league_config 
   SET current_week = 2,  -- Change this to the day number you want
       updated_at = NOW();
   ```
   
   For example:
   - `current_week = 1` → Shows Day 1 games
   - `current_week = 2` → Shows Day 2 games
   - `current_week = 3` → Shows Day 3 games
   - etc.

4. **Refresh your homepage**
   - The homepage will automatically fetch games for the new current week
   - The "TODAY'S GAMES" section will update immediately

## Quick Reference

**Which day do you want to show?**
- Looking at your screenshot, you have games on Dec 25, 2025
- Check which "Day" (week_number) those games belong to in the `games` table
- Set `current_week` to that day number

**To find which day a game belongs to:**
```sql
SELECT game_number, week_number, date, time, 
       home_team.name as home_team, 
       away_team.name as away_team
FROM games
LEFT JOIN teams as home_team ON games.home_team_id = home_team.id
LEFT JOIN teams as away_team ON games.away_team_id = away_team.id
ORDER BY date, time;
```

This will show you all games with their day numbers (week_number).



