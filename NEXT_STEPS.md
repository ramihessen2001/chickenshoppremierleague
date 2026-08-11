# 🚀 Next Steps - Complete Your Database Setup

## ✅ What's Already Done

- ✅ Dependencies installed (`@supabase/supabase-js`, `csv-parse`)
- ✅ Database schema ready (`database/schema.sql`)
- ✅ Data loading script ready (`database/loadData.js`)
- ✅ CSV files ready (`league_data/rosters.csv`, `league_data/schedule.csv`)

---

## 📋 What You Need To Do (10 Minutes)

### Step 1: Create Supabase Project (3 minutes)

1. Go to **[supabase.com](https://supabase.com)**
2. Click **"Sign in"** or **"Start your project"**
3. Click **"New Project"**
4. Fill in the form:
   - **Name**: `YM Soccer League` (or any name you like)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you (e.g., US East)
   - **Pricing Plan**: Free tier is fine
5. Click **"Create new project"**
6. ⏰ Wait 2-3 minutes while Supabase sets up your database

---

### Step 2: Run the Database Schema (2 minutes)

1. In your Supabase project dashboard, find **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `database/schema.sql` in your code editor
4. **Copy the ENTIRE contents** (all 152 lines)
5. **Paste into the Supabase SQL Editor**
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. ✅ You should see: **"Success. No rows returned"**

**What this does:**
- Creates 5 tables (teams, players, games, game_statistics, league_config)
- Sets up security rules (public can read, only admin can write)
- Adds performance indexes
- Initializes league configuration

---

### Step 3: Get Your Supabase Credentials (1 minute)

1. In Supabase dashboard, click the **Settings** ⚙️ icon (bottom left)
2. Click **"API"** in the left menu
3. You'll see three important values:

**Copy these:**

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

---

### Step 4: Create .env.local File (2 minutes)

1. In VS Code, create a **new file** in the project root (same folder as `package.json`)
2. Name it exactly: `.env.local`
3. Copy this template and **replace the placeholder values** with your credentials from Step 3:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...

# Service role key (KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...

# Admin password
NEXT_PUBLIC_ADMIN_PASSWORD=sport2233
```

4. **Save the file**

**⚠️ Important:**
- Use your ACTUAL values, not the examples above
- The keys are very long (200+ characters) - make sure you copy them completely
- `.env.local` is in `.gitignore` so it won't be committed to Git

---

### Step 5: Load Your CSV Data (2 minutes)

Now run the data loading script:

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
   
   Inserted 15 games, skipped 2 playoff placeholders

🔍 Step 3: Verifying data...
   ✅ Teams in database: 6
   ✅ Players in database: 49
   ✅ Games in database: 15

✨ Data load complete! ✨
```

---

### Step 6: Verify in Supabase Dashboard (1 minute)

1. Go back to your Supabase dashboard
2. Click **"Table Editor"** in the left sidebar
3. Check each table:
   - **teams**: Should show 6 teams (Eagles, Panthers, Lions, Dolphins, Knights, Warriors)
   - **players**: Should show ~49 players with names and jersey numbers
   - **games**: Should show 15 games with dates and times
   - **league_config**: Should show 1 row with "YM JAX SOCCER LEAGUE"

**If you see the data, you're done! ✅**

---

## 🎉 You're Ready!

Your database is now set up with:
- ✅ 6 teams
- ✅ 49 players with jersey numbers
- ✅ 15 scheduled games
- ✅ League configuration
- ✅ Security rules configured

### Next Steps:

1. **Start your Next.js app:**
   ```bash
   npm run dev
   ```

2. **Integrate Supabase into your app:**
   - Read `database/README.md` for code examples
   - Use the queries provided to fetch teams, players, games
   - Build your components to display the data

3. **Test admin functionality:**
   - Log in with password: `sport2233`
   - Update game scores
   - Add player statistics
   - Manage rosters

---

## 🆘 Troubleshooting

### Error: "Supabase credentials not configured"
**Solution:** Make sure `.env.local` exists with correct credentials

### Error: "relation 'teams' does not exist"
**Solution:** Run the `schema.sql` file in Supabase SQL Editor

### Error: "row violates row-level security policy"
**Solution:** Make sure you're using the service_role key in the data loading script

### Script runs but no data appears
**Solution:** 
1. Check Supabase dashboard Logs section for errors
2. Verify your CSV files are in the correct location
3. Check that credentials in `.env.local` are correct

---

## 📚 Documentation

- **Full Guide**: `database/README.md`
- **Quick Reference**: `database/SETUP_SUMMARY.md`
- **Schema Details**: `database/schema.sql`
- **Code Examples**: In `database/README.md`

---

**Questions?** Check the Supabase dashboard **Logs** section for detailed error messages.

**Need help?** Review `database/README.md` for troubleshooting and code examples.

---

**Ready to build! 🚀⚽**

