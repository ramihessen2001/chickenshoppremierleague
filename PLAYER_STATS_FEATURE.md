# Player Statistics Feature

## Overview
The Player Statistics page (`/stats`) displays comprehensive statistics for all players in the league with powerful filtering and search capabilities.

## Features

### 1. **Team Filtering**
- Filter players by team using the dropdown menu
- Select "All Teams" to view all players across the league
- Team filter updates results in real-time

### 2. **Player Search**
- Search by player name or jersey number
- Case-insensitive search
- Real-time filtering as you type

### 3. **Statistics Display**
Each player shows:
- **Name & Jersey Number**: Player identification
- **Team**: Team logo and name
- **Position**: Player's position (if recorded)
- **GP (Games Played)**: Number of games the player has participated in
- **Goals**: Total goals scored
- **Assists**: Total assists made
- **Saves**: Total saves (for goalkeepers)

### 4. **Responsive Design**
- **Desktop**: Full table view with sortable columns
- **Mobile**: Card-based layout optimized for small screens

## Navigation
Access the Player Stats page from:
- Homepage: "View Player Stats" button (alongside "View Full Season Schedule" and "View Standings")
- Direct URL: `/stats`

## Data Source
Statistics are fetched from Supabase and aggregated from the `game_statistics` table. The data includes:
- All active players from the `players` table
- Aggregated statistics from all games
- Real-time updates when new stats are added

## Technical Details

### Files Created
- `/app/stats/page.tsx` - Stats page route
- `/app/components/PlayerStatsClient.tsx` - Main client component with filtering and search

### Functions Added
- `getAllPlayersWithStats()` in `lib/supabaseData.ts` - Fetches all players with aggregated statistics

### Styling
- Matches the league's dark theme with coral accents
- Uses consistent borders, shadows, and hover effects
- Fully responsive with mobile-optimized layouts

## Future Enhancements
Potential improvements:
- Sort by any column (goals, assists, etc.)
- Filter by position
- Export statistics to CSV
- Player comparison view
- Season-by-season stats history


