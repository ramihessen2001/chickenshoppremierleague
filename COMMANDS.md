# Quick Command Reference

## ✅ Already Executed

```bash
# Install dependencies
npm install @supabase/supabase-js csv-parse
```

---

## 🔄 What You Need To Run

### After Setting Up Supabase & Creating .env.local

```bash
# Load your CSV data into Supabase
node database/loadData.js
```

**Expected:** Loads 6 teams, 49 players, 15 games

---

### Start Your Application

```bash
# Start Next.js development server
npm run dev
```

Then open: http://localhost:3000

---

## 🛠️ Useful Commands

### Database Management

```bash
# Re-run data loading (if you need to reload data)
node database/loadData.js

# Check if dependencies are installed
npm list @supabase/supabase-js csv-parse
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

### Supabase CLI (Optional - Advanced)

If you want to use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Pull schema from Supabase
supabase db pull

# Push schema to Supabase
supabase db push
```

---

## 📂 Important File Locations

```
.env.local                  ← Create this with your Supabase credentials
database/schema.sql         ← Run this in Supabase SQL Editor
database/loadData.js        ← Run this after setting up .env.local
database/README.md          ← Full documentation
NEXT_STEPS.md              ← Step-by-step setup guide
```

---

## 🔍 Quick Checks

### Verify Dependencies Installed
```bash
npm list @supabase/supabase-js csv-parse
```
**Expected:** Shows version numbers (not "missing")

### Verify .env.local Exists
```bash
ls -la .env.local
```
**Expected:** File exists (not "No such file")

### Verify CSV Files Exist
```bash
ls -la league_data/*.csv
```
**Expected:** Shows rosters.csv and schedule.csv

### Test Supabase Connection
Create a test file `test-supabase.js`:
```javascript
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  const { data, error } = await supabase.from('teams').select('count')
  if (error) {
    console.log('❌ Connection failed:', error.message)
  } else {
    console.log('✅ Connection successful!')
    console.log('   Teams in database:', data)
  }
}

testConnection()
```

Run: `node test-supabase.js`

---

## 🆘 Common Issues

### Issue: "Module not found: @supabase/supabase-js"
```bash
npm install @supabase/supabase-js
```

### Issue: "SUPABASE_URL is not defined"
**Solution:** Create `.env.local` file with your credentials

### Issue: "Permission denied"
```bash
chmod +x database/setup.sh  # Make script executable
```

### Issue: "Port 3000 already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## 📞 Getting Help

1. **Check logs:** Supabase Dashboard → Logs
2. **Read docs:** `database/README.md`
3. **Review setup:** `NEXT_STEPS.md`
4. **Check examples:** Code examples in `database/README.md`

---

**Current Status:**
- ✅ Dependencies installed
- 🔄 Waiting for Supabase setup
- 🔄 Waiting for .env.local creation
- 🔄 Ready to load data

**Next command to run:**
```bash
node database/loadData.js
```
(After completing Steps 1-4 in NEXT_STEPS.md)

