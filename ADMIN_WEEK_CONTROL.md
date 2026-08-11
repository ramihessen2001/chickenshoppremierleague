# Admin Week Control Feature

## Overview
Admins can now change which week/day is displayed as "TODAY'S GAMES" directly from the homepage without needing to access the Supabase dashboard.

## How It Works

### For Admins:
1. **Enable Admin Mode** by clicking the "Admin" button in the navigation bar
2. **Look for the control panel** at the top of the homepage (just below the season title)
3. **Use the arrow buttons** to navigate between days:
   - ← Previous Day
   - → Next Day
4. **The current day number** is displayed in the center (e.g., "Day 2 of 12")
5. **Games update automatically** when you change the day

### Features:
- ✅ Only visible to admins (when admin mode is enabled)
- ✅ Previous/Next buttons to easily navigate days
- ✅ Shows current day and total days
- ✅ Automatically updates the games displayed
- ✅ Saves the selection to the database
- ✅ All users see the updated "current day" after refresh

### Technical Details:
- Updates the `current_week` field in the `league_config` table
- Uses `supabaseAdmin` client to bypass RLS
- Dispatches `dataUpdated` event to refresh other components
- Buttons are disabled at the boundaries (Day 1 and last day)

### Components Added:
- **`CurrentWeekControl.tsx`** - The admin control panel component
- **Updated `HomePageClient.tsx`** - Integrated the control panel

### Database:
The control updates this table:
```sql
UPDATE league_config 
SET current_week = [selected_day],
    updated_at = NOW();
```

## Usage Example:
1. Admin clicks "Admin" button in nav
2. Control panel appears below season title
3. Admin clicks "→" to go from Day 1 to Day 2
4. "TODAY'S GAMES" section updates to show Day 2 games
5. All users now see Day 2 as the current day

## Styling:
- Blue border and background to indicate admin-only feature
- Calendar icon for visual clarity
- Disabled state for boundary buttons
- Smooth transitions and hover effects



