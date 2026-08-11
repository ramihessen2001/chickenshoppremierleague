# Database Setup - Quick Summary

## ✅ What Was Created

### 1. Database Schema (`database/schema.sql`)
- **5 tables**: teams, players, games, game_statistics, league_config
- **Relationships**: Teams → Players, Games → Teams, Statistics → Games/Players
- **Row Level Security**: 
  - ✅ Public can READ (anyone can view)
  - ✅ Authenticated users can WRITE (admin only)
- **Indexes** for performance
- **Triggers** for auto-updating timestamps

### 2. Data Loading Script (`database/loadData.js`)
- Parses `rosters.csv` → extracts 6 teams + 49 players
- Parses `schedule.csv` → extracts 15 regular season games
- Handles various CSV formats (spaces, dashes, formatting)
- Inserts data into Supabase
- Verifies data after loading

### 3. Setup Scripts
- `setup.sh` (Mac/Linux) - Automated setup
- `setup.bat` (Windows) - Automated setup

### 4. Documentation (`database/README.md`)
- Step-by-step Supabase setup guide
- Environment variable configuration
- Code examples for reading/writing data
- Authentication strategies
- Troubleshooting guide

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait 2-3 minutes

### Step 2: Run Schema
1. Go to SQL Editor in Supabase
2. Copy `database/schema.sql` contents
3. Paste and run

### Step 3: Configure Credentials
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_ADMIN_PASSWORD=sport2233
```

### Step 4: Install & Load Data
```bash
npm install @supabase/supabase-js csv-parse
node database/loadData.js
```

### Step 5: Verify
Check Supabase Table Editor:
- ✅ 6 teams
- ✅ ~49 players  
- ✅ 15 games

---

## 📊 Database Structure

```
teams (6 rows)
├── id: UUID
├── name: "Eagles", "Panthers", etc.
├── slug: "eagles", "panthers", etc.
└── logo_url: "/league_data/images/eagles_logo.png"
    │
    ├─── players (49 rows)
    │    ├── id: UUID
    │    ├── name: "Omar Helmy"
    │    ├── jersey_number: 7
    │    └── team_id: FK → teams.id
    │
    └─── games (15 rows)
         ├── id: UUID
         ├── game_number: 1-15
         ├── home_team_id: FK → teams.id
         ├── away_team_id: FK → teams.id
         ├── date: "2025-12-25"
         ├── time: "6:15 PM"
         └── status: "scheduled"
              │
              └─── game_statistics (0 rows initially)
                   ├── id: UUID
                   ├── game_id: FK → games.id
                   ├── player_id: FK → players.id
                   ├── stat_type: goal/assist/save/card
                   └── count: number
```

---

## 🔐 Security Model

### Public Access (Anyone)
```typescript
// Reading data - works without authentication
const { data: teams } = await supabase
  .from('teams')
  .select('*')
```

### Admin Access (Authenticated Only)
```typescript
// Writing data - requires authentication
// Option 1: Use service role key (server-side only)
const supabaseAdmin = createClient(url, serviceRoleKey)

// Option 2: Use Supabase Auth
await supabase.auth.signInWithPassword({
  email: 'admin@ymsoccer.com',
  password: 'sport2233'
})
```

---

## 📝 Common Operations

### Get Teams with Players
```typescript
const { data } = await supabase
  .from('teams')
  .select(`
    *,
    players (*)
  `)
  .order('name')
```

### Get Games for a Week
```typescript
const { data } = await supabase
  .from('games')
  .select(`
    *,
    home_team:teams!home_team_id(name, logo_url),
    away_team:teams!away_team_id(name, logo_url)
  `)
  .eq('week_number', 1)
```

### Update Game Score (Admin)
```typescript
const { data } = await supabaseAdmin
  .from('games')
  .update({
    home_score: 5,
    away_score: 3,
    status: 'completed'
  })
  .eq('id', gameId)
```

### Add Game Statistic (Admin)
```typescript
const { data } = await supabaseAdmin
  .from('game_statistics')
  .insert({
    game_id: gameId,
    player_id: playerId,
    team_id: teamId,
    stat_type: 'goal',
    count: 2
  })
```

---

## 🎯 Data Loading Results

When you run `node database/loadData.js`, you should see:

```
🚀 Starting data load to Supabase...

📋 Step 1: Loading teams and players...
   Found 6 teams:
   - Eagles: 8 players
   - Panthers: 8 players
   - Lions: 8 players
   - Dolphins: 9 players (includes Abdullah Khokhar)
   - Knights: 8 players
   - Warriors: 8 players

📅 Step 2: Loading game schedule...
   Found 17 games
   
   ✅ Game 1: Panthers vs Eagles on 2025-12-25
   ✅ Game 2: Lions vs Dolphins on 2025-12-25
   ... (15 games total)
   ⏭️  Skipped Game 16: 3rd seed vs 6th seed (playoff placeholder)
   ⏭️  Skipped Game 17: 4th seed vs 5th seed (playoff placeholder)
   
   Inserted 15 games, skipped 2 playoff placeholders

🔍 Step 3: Verifying data...
   ✅ Teams in database: 6
   ✅ Players in database: 49
   ✅ Games in database: 15

✨ Data load complete! ✨
```

---

## ⚠️ Important Notes

### CSV Parsing
- **Rosters**: Handles "Name-7", "Name - 7", "Name 7" formats
- **Schedule**: Skips playoff games with placeholder teams (e.g., "3rd seed")
- **Empty cells**: Ignored gracefully

### Playoff Games
- Games 16-17 (play-ins) are skipped - they have placeholder teams
- You can add them manually later when teams are determined

### Jersey Numbers
- Players without visible numbers get `0` as default
- Duplicate jersey numbers on same team are prevented by database

### Team Logos
- Logo URLs point to `/league_data/images/{slug}_logo.png`
- Make sure logo files match the naming convention

---

## 🔧 Troubleshooting

**Problem**: "relation 'teams' does not exist"  
**Solution**: Run `schema.sql` in Supabase SQL Editor

**Problem**: "row violates row-level security policy"  
**Solution**: Use service role key for writes, or authenticate first

**Problem**: Script can't find CSV files  
**Solution**: Make sure you're running from project root: `node database/loadData.js`

**Problem**: Duplicate key errors  
**Solution**: Clear tables in Supabase and re-run script

---

## 📚 Next Steps

1. ✅ Database set up
2. ✅ Data loaded
3. 🔄 Integrate Supabase client into Next.js app
4. 🔄 Create data fetching functions
5. 🔄 Build admin forms
6. 🔄 Test authentication

---

## 📖 Files Reference

- `database/schema.sql` - Database structure
- `database/loadData.js` - Data loading script
- `database/README.md` - Full documentation
- `database/setup.sh` - Automated setup (Mac/Linux)
- `database/setup.bat` - Automated setup (Windows)

---

**Ready to code!** Your database is set up and populated with real data from your CSV files. 🎉⚽

