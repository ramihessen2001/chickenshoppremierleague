# Add Jibreel Wood - SQL Query

## Quick One-Line Query

Copy and paste this into **Supabase SQL Editor**:

```sql
INSERT INTO players (name, jersey_number, team_id, is_active)
VALUES ('Jibreel Wood', 3, (SELECT id FROM teams WHERE name = 'Warriors'), true);
```

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to https://app.supabase.com
- Click on your project
- Click **"SQL Editor"** in the left sidebar

### 2. Paste the Query
Copy this query:

```sql
INSERT INTO players (name, jersey_number, team_id, is_active)
VALUES ('Jibreel Wood', 3, (SELECT id FROM teams WHERE name = 'Warriors'), true);
```

### 3. Run It
- Click **"Run"** (or press Ctrl/Cmd + Enter)
- You should see: **"Success. 1 row affected"**

---

## Verify It Worked

Run this query to confirm:

```sql
SELECT 
  p.name,
  p.jersey_number,
  t.name as team_name
FROM players p
JOIN teams t ON p.team_id = t.id
WHERE p.name = 'Jibreel Wood';
```

**Expected result:**
```
name          | jersey_number | team_name
Jibreel Wood  | 3            | Warriors
```

---

## Alternative: Use Table Editor (No SQL)

If you prefer a visual interface:

1. Go to **Table Editor** in Supabase
2. Click on **players** table
3. Click **"Insert"** → **"Insert row"**
4. Fill in:
   - **name**: `Jibreel Wood`
   - **jersey_number**: `3`
   - **team_id**: Select **Warriors** from dropdown
   - **is_active**: Check the box (true)
5. Click **"Save"**

---

## Check Total Players

After adding Jibreel, verify you have 49 players:

```sql
SELECT COUNT(*) as total_players FROM players;
```

**Expected:** `49`

---

## All Warriors Players

To see all Warriors players including Jibreel:

```sql
SELECT 
  p.name,
  p.jersey_number
FROM players p
JOIN teams t ON p.team_id = t.id
WHERE t.name = 'Warriors'
ORDER BY p.jersey_number;
```

**Expected:** 9 players (including Jibreel Wood with jersey #3)

---

**That's it!** Jibreel Wood is now in your database! ⚽

