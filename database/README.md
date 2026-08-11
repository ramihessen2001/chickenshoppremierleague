# Database Setup Guide

This guide will help you set up a Supabase database and load your roster and schedule data.

## Prerequisites

- Supabase account (free tier works fine)
- Node.js installed (v18+ recommended)
- Your CSV files: `rosters.csv` and `schedule.csv`

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in/up
2. Click "New Project"
3. Fill in:
   - **Name**: YM Soccer League
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for project to be ready

---

## Step 2: Get Your Credentials

Once your project is ready:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click **API** in the left menu
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...  (this is safe for client-side)
service_role key: eyJhbGc...  (keep this SECRET - server-side only)
```

---

## Step 3: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor** (in sidebar)
2. Click **New Query**
3. Copy the entire contents of `database/schema.sql`
4. Paste into the SQL editor
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see: "Success. No rows returned"

**What this does:**
- Creates 5 tables: teams, players, games, game_statistics, league_config
- Sets up relationships between tables
- Adds indexes for performance
- Configures Row Level Security (RLS):
  - Public can READ all data (anyone can view)
  - Only authenticated users can WRITE (admin only)

---

## Step 4: Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key...

# Service role key (for data loading script only - DO NOT expose to client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key...

# Admin password (client-side)
NEXT_PUBLIC_ADMIN_PASSWORD=sport2233
```

**Important:**
- `NEXT_PUBLIC_*` variables are exposed to the browser (safe)
- `SUPABASE_SERVICE_ROLE_KEY` is server-only (keep secret)
- Never commit `.env.local` to Git (already in `.gitignore`)

---

## Step 5: Install Dependencies

```bash
npm install @supabase/supabase-js csv-parse
```

---

## Step 6: Load Your CSV Data

Run the data loading script:

```bash
node database/loadData.js
```

**Expected output:**
```
🚀 Starting data load to Supabase...

📋 Step 1: Loading teams and players...
   Found 6 teams:
   - Eagles: 8 players
   - Panthers: 8 players
   - Lions: 8 players
   - Dolphins: 9 players
   - Knights: 8 players
   - Warriors: 8 players
   
   ✅ Inserted team: Eagles (uuid...)
   ✅ Inserted 8 players for Eagles
   ...

📅 Step 2: Loading game schedule...
   Found 17 games
   
   ✅ Game 1: Panthers vs Eagles on 2025-12-25
   ✅ Game 2: Lions vs Dolphins on 2025-12-25
   ...
   ⏭️  Skipped Game 16: 3rd seed vs 6th seed (playoff placeholder)
   
   Inserted 15 games, skipped 2 playoff placeholders

🔍 Step 3: Verifying data...
   ✅ Teams in database: 6
   ✅ Players in database: 49
   ✅ Games in database: 15

✨ Data load complete! ✨
```

---

## Step 7: Verify Data in Supabase

1. Go to **Table Editor** in Supabase dashboard
2. Check each table:
   - **teams**: Should have 6 rows (Eagles, Panthers, Lions, Dolphins, Knights, Warriors)
   - **players**: Should have ~49 rows with names and jersey numbers
   - **games**: Should have 15 rows with schedules
   - **league_config**: Should have 1 row with league info

---

## Step 8: Configure Supabase Client in Your App

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## Using the Database in Your App

### Reading Data (Public - Anyone Can View)

```typescript
// Get all teams
const { data: teams, error } = await supabase
  .from('teams')
  .select('*, players(*)')
  .order('name')

// Get games for current week
const { data: games } = await supabase
  .from('games')
  .select(`
    *,
    home_team:teams!home_team_id(name, slug, logo_url),
    away_team:teams!away_team_id(name, slug, logo_url)
  `)
  .eq('week_number', 1)
  .order('date', { ascending: true })

// Get top 5 goal scorers
const { data: leaders } = await supabase
  .from('game_statistics')
  .select(`
    player:players(name, jersey_number),
    count
  `)
  .eq('stat_type', 'goal')
  .order('count', { ascending: false })
  .limit(5)
```

### Writing Data (Admin Only - Requires Authentication)

For admin operations, you need to authenticate first:

```typescript
// Sign in with admin password (in your admin authentication logic)
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@ymsoccer.com', // You'll need to create this user in Supabase Auth
  password: 'sport2233'
})

// Then admin can write data
const { data: newGame, error } = await supabase
  .from('games')
  .insert({
    game_number: 16,
    date: '2026-01-15',
    time: '6:00 PM',
    home_team_id: 'team-uuid',
    away_team_id: 'team-uuid'
  })
```

---

## Setting Up Admin Authentication

### Option 1: Simple Approach (No Supabase Auth)

Keep your current client-side password check (`sport2233`).

For admin writes, use the service role key server-side:

```typescript
// Server action (Next.js)
'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bypasses RLS
)

export async function updateGameScore(gameId: string, homeScore: number, awayScore: number) {
  // Your client-side code already verified admin password
  const { data, error } = await supabaseAdmin
    .from('games')
    .update({ home_score: homeScore, away_score: awayScore, status: 'completed' })
    .eq('id', gameId)
  
  return { data, error }
}
```

### Option 2: Supabase Auth (More Secure)

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `admin@ymsoccer.com`
   - Password: `sport2233`
   - Confirm password
4. Click **Create user**

Then in your app:

```typescript
// Admin login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@ymsoccer.com',
  password: 'sport2233'
})

// Check auth state
const { data: { user } } = await supabase.auth.getUser()

// Admin writes now work automatically (RLS allows authenticated users)
```

---

## Troubleshooting

### Error: "relation 'teams' does not exist"
**Solution**: Run the `schema.sql` script in SQL Editor

### Error: "new row violates row-level security policy"
**Solution**: 
- For reads: Check RLS policies allow public SELECT
- For writes: Make sure you're authenticated or using service role key

### Script says "Supabase credentials not configured"
**Solution**: Set environment variables in `.env.local` or edit `loadData.js` directly

### Data loading script fails partway through
**Solution**: 
1. Go to Supabase Table Editor
2. Delete all data from tables (use "Delete" button)
3. Re-run the script

### Can't find CSV files
**Solution**: Make sure CSV files are in `/league_data/` directory

---

## Database Maintenance

### Adding New Players

```typescript
const { data, error } = await supabase
  .from('players')
  .insert({
    name: 'New Player',
    jersey_number: 15,
    team_id: 'team-uuid',
    is_active: true
  })
```

### Updating Game Scores

```typescript
const { data, error } = await supabase
  .from('games')
  .update({
    home_score: 5,
    away_score: 3,
    status: 'completed'
  })
  .eq('id', 'game-uuid')
```

### Adding Game Statistics

```typescript
const { data, error } = await supabase
  .from('game_statistics')
  .insert({
    game_id: 'game-uuid',
    player_id: 'player-uuid',
    team_id: 'team-uuid',
    stat_type: 'goal',
    count: 2 // Player scored 2 goals
  })
```

---

## Next Steps

1. ✅ Database schema created
2. ✅ CSV data loaded
3. ✅ Environment variables configured
4. 🔄 Integrate Supabase client into Next.js app
5. 🔄 Build data fetching functions
6. 🔄 Build admin forms that write to database
7. 🔄 Test read/write operations

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

---

**Questions?** Check the Supabase dashboard for real-time logs and errors in the **Logs** section.

