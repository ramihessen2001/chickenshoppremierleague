# Add Service Role Key to .env.local

## Problem
The app can't save game statistics because it needs admin permissions to write to the database.

## Solution
Add the service role key to your `.env.local` file so the app can perform admin operations.

## Steps

1. Open your `.env.local` file
2. Add this line (you already have this key from earlier):

```env
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdGthY3N0eXVoamhubWViZ3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODk1OSwiZXhwIjoyMDgxMjI0OTU5fQ.7nj-Fm54cSi7jdXZWQhMR4OEH804p0_lYvvmPw1u5hs
```

3. Save the file
4. Restart your development server:
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

## Your .env.local should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yftkacstyuhjhnmebgzv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdGthY3N0eXVoamhubWViZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDg5NTksImV4cCI6MjA4MTIyNDk1OX0.eiw5sYqCXiTOkUhLT_IhQmVqzpQxI-YFKNjhXhIqUCk
NEXT_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdGthY3N0eXVoamhubWViZ3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODk1OSwiZXhwIjoyMDgxMjI0OTU5fQ.7nj-Fm54cSi7jdXZWQhMR4OEH804p0_lYvvmPw1u5hs
```

## Why This is Needed
- The Supabase database has Row Level Security (RLS) policies
- These policies only allow authenticated users to write data
- The service role key bypasses RLS for admin operations
- This is safe because it's only used server-side for admin actions

## After Adding
Once you've added the key and restarted the server:
1. Go to homepage
2. Login as admin (password: `sport2233`)
3. Click edit on a game
4. Add statistics
5. Click Save
6. ✅ Should save successfully without errors!

