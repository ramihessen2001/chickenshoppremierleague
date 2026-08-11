# 🔍 Duplicate Jersey Numbers Found!

## Issue

Your `rosters.csv` has **duplicate jersey numbers** on the **Warriors** team:

```
Warriors (Column 6):
- Row 3: Ahmed Ebadi 2        ← Jersey #2
- Row 9: Jibreel Wood 2        ← Jersey #2 (DUPLICATE!)
```

**Database rule:** Each player on a team must have a **unique jersey number**.

---

## How to Fix

### Option 1: Fix the CSV File (Recommended)

1. Open `league_data/rosters.csv` in VS Code or Excel
2. Look at the **Warriors column** (6th column)
3. Find these two players:
   - **Ahmed Ebadi 2** (Row 3)
   - **Jibreel Wood 2** (Row 9)
4. Change one of their jersey numbers

**Which number to change?**
- Check the actual jersey numbers from your league
- Or assign a new unique number that's not used by other Warriors players

**Warriors current jersey numbers:**
- 63 - Hamza Harun
- 2 - Ahmed Ebadi ← 
- 7 - Ilias Melloul
- 22 - Ahmed Abdalla
- 9 - Yusuf Sadiq
- 10 - Shahene Abdelkarim
- 8 - Justin Rahman
- 30 - Selim Elkhawalka
- 2 - Jibreel Wood ← DUPLICATE
- 1 - Akil Ali Baksh (Row 9, column 6)

**Available numbers:** 3, 4, 5, 6, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, etc.

### Option 2: Update the Script to Auto-Assign

The updated script will now **skip the duplicate** and show a warning:

```bash
node database/loadData.js
```

Output:
```
⚠️  DUPLICATE JERSEY #2 on Warriors:
    - Ahmed Ebadi (already added)
    - Jibreel Wood (skipped)
    → Please fix rosters.csv
```

This way, the script won't crash, but **Jibreel Wood won't be in the database** until you fix the CSV.

---

## Recommended Fix

**Change Jibreel Wood's jersey number:**

Open `rosters.csv` and change row 9, Warriors column from:
```
Jibreel Wood 2
```

To (pick an available number):
```
Jibreel Wood 3
```

Or whatever his actual jersey number is!

---

## After Fixing the CSV

### Option A: Clear Database and Reload

If you want to start fresh:

1. Go to Supabase dashboard
2. Go to Table Editor
3. Click on `players` table
4. Delete all rows (or just Warriors players)
5. Re-run: `node database/loadData.js`

### Option B: Manually Add Missing Player

If you don't want to reload everything:

1. Go to Supabase Table Editor
2. Click on `players` table
3. Click "Insert row"
4. Fill in:
   - name: `Jibreel Wood`
   - jersey_number: `3` (or correct number)
   - team_id: (select Warriors from dropdown)
   - is_active: `true`
5. Click "Save"

---

## Quick Fix Command

After updating the CSV:

```bash
node database/loadData.js
```

The script now detects duplicates and will skip them with a warning instead of crashing!

---

## Prevention

The database has a **unique constraint** that prevents duplicate jersey numbers:

```sql
UNIQUE(team_id, jersey_number)
```

This ensures data integrity - no two players on the same team can have the same number (just like real soccer!). ⚽

---

## Summary

**Problem:** Ahmed Ebadi and Jibreel Wood both have jersey #2 on Warriors  
**Solution:** Change one player's number in `rosters.csv`  
**After fix:** Re-run `node database/loadData.js`

The updated script will now handle duplicates gracefully and continue loading the rest of the data!

