# 🔧 Fix: Team Logos Not Showing

## 🎯 Problem

Team logos are not displaying because:
- Supabase has logo URLs like: `/league_data/images/eagles_logo.png`
- But Next.js can only serve from: `/images/eagles_logo.png` (in `/public` folder)

## ✅ Solution

You need to update the Supabase database to use the correct paths.

### Option 1: Run SQL in Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Open your project
   - Click "SQL Editor" in sidebar

2. **Run this SQL:**
   ```sql
   UPDATE teams
   SET logo_url = REPLACE(logo_url, '/league_data/images/', '/images/')
   WHERE logo_url LIKE '/league_data/images/%';
   ```

3. **Verify:**
   ```sql
   SELECT name, logo_url FROM teams ORDER BY name;
   ```

   You should see:
   ```
   Eagles  | /images/eagles_logo.png
   Panthers| /images/panthers_logo.png
   etc...
   ```

4. **Refresh your browser** - Logos should now appear!

### Option 2: Use the SQL File

```bash
# The SQL file is already created:
database/fix_logo_urls.sql

# Copy the SQL and paste it into Supabase SQL Editor
```

### Option 3: Reload All Data (Nuclear Option)

If you want to reload everything:

```bash
cd database
node loadData.js
```

But first, update `loadData.js` line 81 to:
```javascript
logo_url: `/images/${createSlug(name.trim())}_logo.png`,
```

## 🎯 Why This Happened

When data was loaded to Supabase, the script used:
```javascript
// OLD (Wrong for Next.js):
logo_url: `/league_data/images/${slug}_logo.png`

// SHOULD BE:
logo_url: `/images/${slug}_logo.png`
```

Next.js **only** serves files from `/public/` directory, and they're accessed without the `/public` prefix:
- File location: `/public/images/eagles_logo.png`
- URL to access: `/images/eagles_logo.png` ✅
- NOT: `/league_data/images/eagles_logo.png` ❌

## ✅ After Fix

Team pages will display:
- ✅ Team logo (from Supabase with correct path)
- ✅ Full roster (from Supabase)
- ✅ Team schedule (from Supabase)
- ✅ Everything working!

---

**Status:** SQL script created in `database/fix_logo_urls.sql`

**Action needed:** Run the SQL in Supabase Dashboard to fix logo URLs! 🚀


