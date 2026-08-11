# YM JAX Soccer League - Admin Guide

## 🔐 Admin Authentication

### Logging In
1. Click the "ADMIN" button in the footer of any page
2. Enter the admin password: `sport2233`
3. You'll see an orange banner at the top indicating admin mode is active
4. Click "EXIT ADMIN MODE" in the banner to log out

### Admin Password
- Default password: `sport2233`
- To change: Set `NEXT_PUBLIC_ADMIN_PASSWORD` environment variable

---

## 📊 Box Score Management

### Editing Box Scores (Homepage & Schedule)
1. Log in as admin
2. Navigate to the homepage or full schedule
3. Click the **blue pencil icon** on any game card
4. Edit the following:
   - **Final Scores**: Home and away team scores
   - **Statistics**: Add/edit/remove:
     - Goals
     - Assists
     - Saves
     - Yellow Cards
     - Red Cards
     - Blue Cards
5. Click "Save Changes"

### Adding Statistics
- Click "+ Add Statistic"
- Select player from dropdown (grouped by team)
- Choose statistic type
- Set count (usually 1, but can be multiple)
- Click save

### Deleting Statistics
- Click the red trash icon next to any statistic
- The statistic will be removed immediately

---

## 📅 Schedule Management

### Viewing Full Schedule
- Navigate to `/schedule` or click "View Full Season Schedule" on homepage
- All 12 weeks are displayed
- Admin controls appear on each game card

### Adding a New Game
1. Log in as admin
2. Go to the schedule page
3. Click "+ Add Game" button for the desired week
4. Fill in:
   - Week Number (1-12)
   - Date (YYYY-MM-DD)
   - Time (e.g., "10:00 AM")
   - Location (e.g., "Main Field")
   - Home Team
   - Away Team
   - Status (Scheduled/Completed/Cancelled/Postponed)
   - Scores (if status is "Completed")
5. Click "Save Game"

### Editing a Game
1. Click the **yellow edit icon** on any game card
2. Modify game details
3. Click "Save Game"

### Deleting a Game
1. Click the **red trash icon** on any game card
2. Confirm deletion
3. Game and associated statistics will be removed

---

## 👥 Roster Management

### Viewing Team Rosters
- Click any team logo on the homepage
- Or navigate to `/teams/[teamId]` (e.g., `/teams/eagles`)

### Adding a Player
1. Log in as admin
2. Navigate to a team roster page
3. Click "+ Add Player" button
4. Fill in:
   - **Player Name** (required)
   - **Jersey Number** (0-99 or "TBD")
   - **Team** (dropdown)
   - **Position** (optional: Forward, Midfielder, Defender, Goalkeeper)
   - **Active Status** (checkbox)
5. Click "Save Player"

### Editing a Player
1. Click the **blue pencil icon** on any player card
2. Modify player details
3. Click "Save Player"

### Deleting a Player
1. Click the **red trash icon** on any player card
2. Confirm deletion
3. Player will be removed from roster

### Jersey Number Notes
- Enter a number (0-99) or leave as "TBD" if not assigned yet
- Players with "TBD" jersey numbers appear at the end of the roster list

---

## 💾 Data Storage (Phase 1)

### How Data is Stored
- **localStorage**: All data (games, statistics, players) is stored in your browser's localStorage
- **Automatic Sync**: Changes are immediately reflected across all pages
- **Cross-Tab Support**: Multiple tabs will sync automatically

### Important Notes
1. **Browser-Specific**: Data is stored per browser. Different browsers = different data.
2. **No Backup**: Clearing browser data will delete all league information.
3. **Single Admin**: Only works for one admin at a time (same browser).

### Exporting Data (Manual)
1. Open browser DevTools (F12)
2. Go to "Console" tab
3. Run: `JSON.stringify(localStorage)`
4. Copy and save the output

### Importing Data (Manual)
1. Save exported data to a text file
2. Open browser DevTools (F12)
3. Go to "Console" tab
4. Paste and run the saved data

### Future Database Migration
In Phase 3, this localStorage system will be replaced with Supabase/PostgreSQL for:
- Multi-admin support
- Automatic backups
- Real-time collaboration
- API access

---

## 🎨 Admin UI Elements

### Visual Indicators
- **Orange Banner**: Admin mode is active
- **Blue Pencil Icon**: Edit box scores/players
- **Yellow Edit Icon**: Edit game details
- **Red Trash Icon**: Delete items
- **Blue "+ Add" Buttons**: Create new items

### Admin-Only Features
All editing features are **hidden from public users** and only appear when logged in as admin.

---

## 🚀 Quick Workflow Examples

### Scenario 1: Adding Game Results After a Match
1. Log in as admin
2. Go to schedule or homepage
3. Click blue pencil on the game
4. Enter final scores
5. Add statistics (goals, assists, saves)
6. Save changes

### Scenario 2: Adding a New Player Mid-Season
1. Log in as admin
2. Navigate to team roster
3. Click "+ Add Player"
4. Enter player details
5. Set jersey number or use "TBD"
6. Save player

### Scenario 3: Rescheduling a Game
1. Log in as admin
2. Go to schedule
3. Click yellow edit icon on game
4. Change date/time
5. Update status to "Postponed" if needed
6. Save changes

---

## 🐛 Troubleshooting

### Changes Not Appearing
- **Hard refresh** the page (Cmd+Shift+R or Ctrl+Shift+R)
- Ensure you're logged in as admin
- Check browser console for errors

### Lost Admin Session
- Admin sessions are stored in `sessionStorage`
- Closing the browser tab will log you out
- Simply log in again with the password

### Data Issues
- If data becomes corrupted, clear localStorage:
  - DevTools → Application → Local Storage → Clear
  - Refresh page to reinitialize with sample data

### Build Issues
- Run `npm install` to ensure dependencies are up to date
- Run `npm run build` to verify no TypeScript errors
- Check `next.config.ts` for configuration issues

---

## 📚 Developer Notes

### Key Files
- **lib/localStore.ts**: localStorage CRUD operations
- **lib/adminContext.tsx**: Admin authentication state
- **app/components/Edit*.tsx**: All admin editing modals
- **types/**: TypeScript type definitions

### Testing Admin Features
1. Start dev server: `npm run dev`
2. Open http://localhost:3000
3. Click ADMIN button
4. Enter password: `sport2233`
5. Test all CRUD operations

### Production Deployment
- Ensure `NEXT_PUBLIC_ADMIN_PASSWORD` is set in environment variables
- Run `npm run build` to verify build succeeds
- Deploy to Vercel/Netlify/etc.

---

## ✅ Feature Checklist

- [x] Admin authentication with password
- [x] Box score editing (scores + statistics)
- [x] Schedule management (add/edit/delete games)
- [x] Roster management (add/edit/delete players)
- [x] Real-time UI updates
- [x] localStorage persistence
- [x] Visual admin indicators
- [x] Responsive design
- [x] Keyboard navigation (Escape to close modals)
- [x] Confirmation dialogs for deletions

---

## 🎯 Next Steps (Phase 3)

1. **Database Migration**: Replace localStorage with Supabase
2. **API Routes**: Create Next.js API routes for CRUD operations
3. **Multi-Admin**: Support multiple admins simultaneously
4. **Audit Log**: Track who changed what and when
5. **Image Upload**: Allow logo and photo uploads
6. **CSV Export**: Export rosters and statistics to CSV
7. **Email Notifications**: Notify teams of schedule changes

For questions or issues, refer to the main README.md or contact the development team.




