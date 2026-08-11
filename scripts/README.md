# Scripts Directory

Utility scripts for loading and managing data in the YM JAX Soccer League application.

## 📅 Load Schedule from CSV

### Method 1: Browser Console (Easiest!)

1. **Open your app** in a web browser (http://localhost:3000)
2. **Open DevTools** (Press `F12` or right-click → Inspect)
3. **Go to Console tab**
4. **Copy/paste** the entire contents of `loadScheduleClient.js` into the console
5. **Press Enter**
6. **Refresh the page** - you'll see the new schedule!

### Method 2: Node.js Script (For Developers)

```bash
# From the project root
npx tsx scripts/loadSchedule.ts
```

This will output the parsed games as JSON. You can then:
- Copy the JSON to `lib/sampleData.ts` as `FULL_SEASON_GAMES`
- Or use it to seed a database

## 📝 What Gets Loaded?

From `league_data/schedule.csv`:
- **15 regular season games** (Weeks 1-5)
- Dates, times, and team matchups
- Game numbers and locations

**Note:** Playoff games are not included in the current parsing (can be added later).

## 🎯 Current Schedule Structure

```
Week 1 (12/25-12/26):
  - Game 1-6: Round-robin matchups

Week 2 (12/28):
  - Game 7-9: Round 2

Week 3 (12/30):
  - Game 10-12: Round 3

Week 4 (1/2):
  - Game 13-15: Round 4

Playoffs (1/3-1/10):
  - Play-ins, Semi-finals, Finals (to be implemented)
```

## ✏️ Editing Schedule in Admin Mode

Once the schedule is loaded:

1. **Login as admin** (password: `sport2233`)
2. **Navigate to** `/schedule` (Full Season Schedule page)
3. **Edit any game:**
   - Click the pencil icon on a game card
   - Modify date, time, location, teams, or status
   - Click "Save Game"
4. **Add new games:**
   - Click "+ Add Game" button in any week
   - Fill in game details
   - Click "Save Game"
5. **Delete games:**
   - Click the trash icon on a game card
   - Confirm deletion

## 🔄 Data Flow

```
schedule.csv → parseScheduleCSV() → localStorage → React App → Display
                                         ↕
                                   Admin Edits
```

## 📂 Files

- `loadScheduleClient.js` - Browser-based loader (copy/paste into console)
- `loadSchedule.ts` - Node.js script for parsing (outputs JSON)
- `../league_data/schedule.csv` - Source schedule data
- `../lib/dataParser.ts` - Parser functions (parseScheduleCSV)
- `../lib/localStore.ts` - localStorage management

## 🐛 Troubleshooting

### Schedule not showing up?
- Make sure you refreshed the page after loading
- Check console for errors
- Clear localStorage and try again: `localStorage.clear()`

### Wrong week numbers?
- Adjust `LEAGUE_CONFIG.startDate` in `lib/sampleData.ts`
- Current start date: 2025-01-08

### Team names not matching?
- Ensure team names in CSV match: Eagles, Panthers, Lions, Dolphins, Knights, Warriors
- Team names are case-insensitive and automatically normalized

## 🚀 Future Enhancements

- [ ] Parse playoff games with special logic
- [ ] Import box scores from CSV
- [ ] Export edited schedule back to CSV
- [ ] Database integration (PostgreSQL/Supabase)
- [ ] Multi-admin support with conflict resolution




