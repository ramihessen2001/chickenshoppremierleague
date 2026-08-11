# EditGameModal Fix - December 23, 2025

## Problem
When trying to edit game information via the "Edit Game" modal, the changes were not being saved to the Supabase database. The error message "Failed to save game" appeared.

## Root Cause
The `EditGameModal` component was still using **local storage functions** (`updateLocalGame`, `addLocalGame`) instead of Supabase functions. This meant:
- Changes were only being saved to browser localStorage
- No data was reaching the Supabase database
- The app was reading from Supabase but writing to localStorage

## Solution

### 1. Added New Supabase Functions (lib/supabaseData.ts)

Created two new admin functions to handle game CRUD operations:

#### `updateGame(gameId, updates)`
- Updates existing game details (date, time, location, teams, status, scores)
- Uses `supabaseAdmin` client to bypass RLS
- Accepts partial updates (only changes what's provided)

#### `createGame(gameData)`
- Creates a new game in the database
- Uses `supabaseAdmin` client to bypass RLS
- Returns the new game ID on success

### 2. Updated EditGameModal Component (app/components/EditGameModal.tsx)

**Changes:**
- **Removed:** Import of `addLocalGame` and `updateLocalGame` from localStore
- **Added:** Import of `updateGame`, `createGame`, `getTeams`, `getAllGames` from supabaseData
- **Added:** State to load and store Supabase teams (with UUIDs)
- **Updated:** `handleSave` function to:
  - Load teams from Supabase to get UUIDs
  - Convert team slugs to UUIDs for database operations
  - Use `updateGame()` for editing existing games
  - Use `createGame()` for adding new games
  - Generate proper game numbers for new games

## Key Technical Details

### Team ID Handling
The UI uses team **slugs** (e.g., "eagles", "panthers") for user-friendly URLs and display, but the database uses **UUIDs** for foreign key relationships. The fix properly converts between these formats:
- UI → Database: slug → UUID lookup
- Database → UI: UUID → slug via join

### Admin Permissions
All write operations use `supabaseAdmin` (service role key) to bypass Row Level Security (RLS) policies, since only authenticated admin users should be able to edit games.

### Game Number Generation
For new games, the function finds the maximum existing game number and increments it by 1.

## Testing

✅ Build passes: `npm run build`
✅ No TypeScript errors
✅ No linter errors
✅ Committed and pushed to GitHub

## Deployment

**For local development:** Dev server restarted - changes are live at http://localhost:3000

**For Vercel production:** 
1. Ensure environment variables are set in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_SERVICE_KEY` ← **Required for admin writes**
2. The latest push to `main` will trigger auto-deployment

## Next Steps
1. Test editing an existing game locally
2. Test creating a new game locally
3. Verify changes persist in Supabase database
4. Once confirmed locally, test in production after Vercel deployment completes




