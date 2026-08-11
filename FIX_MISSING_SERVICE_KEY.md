# ⚠️ Missing Service Role Key!

## Issue Found

Your `.env.local` file is missing the **SUPABASE_SERVICE_ROLE_KEY** which is required for loading data.

Current keys in your `.env.local`:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY  
- ✅ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- ❌ **SUPABASE_SERVICE_ROLE_KEY** ← MISSING!

---

## How to Fix

### Step 1: Get Your Service Role Key

1. Go to your Supabase project: https://app.supabase.com
2. Click on your project (YM Soccer or whatever you named it)
3. Go to **Settings** ⚙️ (bottom left sidebar)
4. Click **API** in the left menu
5. Scroll down to **Project API keys**
6. Find the **`service_role`** key (NOT the anon key)
7. Click the **copy icon** to copy it

**⚠️ Important:** 
- The service_role key is DIFFERENT from the anon key
- It's a long string starting with `eyJhbGc...`
- Keep this key SECRET - never commit it to Git or share publicly

---

### Step 2: Add to .env.local

Open your `.env.local` file and add this line:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```

**Replace the value after the `=` with your ACTUAL service_role key from Supabase!**

---

### Step 3: Verify Your .env.local

Your complete `.env.local` should look like this:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://yftkacstyuhjhnmebgzv.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."

# Service role key (for data loading - KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_actual_service_role_key...

# Admin password
NEXT_PUBLIC_ADMIN_PASSWORD=sport2233
```

**Note:** The service_role key should NOT have quotes around it (or if it does, that's fine - the script handles both).

---

### Step 4: Run the Data Loading Script Again

After adding the service_role key:

```bash
node database/loadData.js
```

You should see:
```
✅ Loaded environment variables from .env.local

🔍 Checking environment variables...
   SUPABASE_URL: Found (https://yftkacstyuhjhnmebgzv...)
   SERVICE_KEY: Found (eyJhbGc...)

🚀 Starting data load to Supabase...
```

---

## Why Do We Need the Service Role Key?

The **service_role** key:
- Bypasses Row Level Security (RLS) policies
- Allows the script to INSERT data into the database
- Is only used server-side in scripts (never in browser)

The **anon** key:
- Respects Row Level Security
- Used in the browser/client-side code
- Can only READ data (per our RLS policies)

For loading initial data, we need the service_role key!

---

## Quick Check

Run this to verify the key exists:

```bash
grep "SUPABASE_SERVICE_ROLE_KEY" .env.local
```

You should see a line with the key (not "NOT FOUND").

---

**Once you add the service_role key, run:**
```bash
node database/loadData.js
```

This will load your 6 teams, 49 players, and 15 games into Supabase! 🚀

