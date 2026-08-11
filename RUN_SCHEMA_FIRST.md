# ⚠️ Database Schema Not Created!

## Issue

The error `Could not find the table 'public.teams'` means the database tables haven't been created in Supabase yet.

---

## Fix: Run the Database Schema

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Click on your project
3. Click **"SQL Editor"** in the left sidebar (looks like a terminal icon)

### Step 2: Create a New Query

1. Click **"New Query"** button (top left)

### Step 3: Copy the Schema

1. Open the file: `database/schema.sql` in VS Code
2. Select ALL content (Cmd+A or Ctrl+A)
3. Copy it (Cmd+C or Ctrl+C)

### Step 4: Paste and Run

1. Back in Supabase SQL Editor, paste the schema (Cmd+V or Ctrl+V)
2. Click **"Run"** button (or press Ctrl/Cmd + Enter)
3. Wait a few seconds...
4. You should see: ✅ **"Success. No rows returned"**

---

## What This Creates

The schema creates these tables:
- ✅ **teams** - Will hold your 6 teams
- ✅ **players** - Will hold your ~49 players  
- ✅ **games** - Will hold your 15 games
- ✅ **game_statistics** - Will hold box scores
- ✅ **league_config** - League settings

Plus:
- Security rules (public can read, admin can write)
- Performance indexes
- Data validation rules

---

## After Running Schema

Once you see "Success" in Supabase:

### Re-run the Data Loading Script

```bash
node database/loadData.js
```

**Expected output:**
```
✅ Inserted team: Eagles (uuid...)
✅ Inserted 8 players for Eagles
✅ Inserted team: Panthers (uuid...)
✅ Inserted 8 players for Panthers
...
✅ Game 1: Panthers vs Eagles on 2025-12-25
✅ Game 2: Lions vs Dolphins on 2025-12-25
...
Inserted 15 games, skipped 2 playoff placeholders

✅ Teams in database: 6
✅ Players in database: 49
✅ Games in database: 15

✨ Data load complete! ✨
```

---

## Verify in Supabase

After successful load:

1. Go to **"Table Editor"** in Supabase
2. Click on **"teams"** table
3. You should see 6 rows (Eagles, Panthers, Lions, Dolphins, Knights, Warriors)
4. Click on **"players"** table
5. You should see ~49 rows with player names and jersey numbers
6. Click on **"games"** table  
7. You should see 15 scheduled games

---

## Quick Commands

### Check if schema is loaded:
In Supabase SQL Editor, run:
```sql
SELECT COUNT(*) FROM teams;
```

If you get an error "relation does not exist", the schema isn't loaded yet.
If you get a number (even 0), the schema is loaded!

### After schema is loaded:
```bash
node database/loadData.js
```

---

## Need the Schema File?

The schema is in: **`database/schema.sql`**

Or view it in VS Code:
```bash
code database/schema.sql
```

---

**TL;DR:**
1. Open Supabase SQL Editor
2. Copy ALL of `database/schema.sql`
3. Paste and click "Run"
4. Then run: `node database/loadData.js`

🎯 **This is the missing step!** Once you run the schema, everything will work.

