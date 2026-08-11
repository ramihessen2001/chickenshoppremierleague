# Playoff Bracket Feature

## Overview
The Playoff Bracket displays the tournament structure on the homepage, showing semifinal and final matchups with team seeds, dates, and times.

## Tournament Structure

### Semifinals - January 4th, 2026
1. **Game 1 @ 8:00 PM**
   - Eagles (Seed #6) vs Warriors (Seed #3)

2. **Game 2 @ 9:15 PM**
   - Lions (Seed #5) vs Dolphins (Seed #4)

### Finals - January 9th, 2026
1. **Game 1 @ 8:00 PM**
   - Knights (Seed #1) vs Lower Seed Winner from Semifinals

2. **Game 2 @ 9:15 PM**
   - Panthers (Seed #2) vs Higher Seed Winner from Semifinals

### Championship
- Winners of the two finals advance to the Championship Game

## Features

### Current Implementation
- ✅ Visual bracket display with team logos
- ✅ Seeding information for all teams
- ✅ Game dates and times
- ✅ Round labels (Play-In, Semifinal, Final)
- ✅ Responsive layout (2-column on desktop, stacked on mobile)
- ✅ Championship progression note
- ✅ **Full EditBoxScoreModal integration** - Edit playoff games with statistics and Man of The Match
- ✅ Data persistence in localStorage

### Bracket Layout
- **Left Column**: Semifinal games (January 4th)
- **Right Column**: Final games (January 9th)
- **Bottom**: Championship information and seeding notes

## Component Structure

### `PlayoffBracket.tsx`
Main component that renders the entire bracket.

**Key Elements:**
- `GameCard`: Displays individual matchup with teams, seeds, date, time
- Semifinal games: Fixed matchups
- Final games: TBD opponents based on semifinal results
- Visual indicators for winners (green highlight when results are added)

## Future Enhancements (Admin Functionality)

The following features can be added for admin control:

1. **Update Game Results**
   - Add scores for completed games
   - Automatically advance winners to next round
   - Update TBD matchups based on seeding rules

2. **Dynamic Bracket Updates**
   - Store playoff games in Supabase
   - Real-time updates when admins enter results
   - Automatic bracket progression

3. **Championship Game**
   - Add championship matchup after finals complete
   - Display final winner with trophy icon

## Styling
- Dark theme with coral (`#D47F7D`) accents
- Gold (`#FFD700`) trophy icons
- Green highlights for winning teams
- Responsive grid layout
- Shadow effects and rounded corners

## Location
The playoff bracket is displayed on the homepage between:
- Weekly Games section (above)
- Team Logos section (below)

## Technical Details

### Files Created
- `/app/components/PlayoffBracket.tsx` - Main bracket component
- Updated `/app/components/HomePageClient.tsx` - Integrated bracket into homepage

### Data Structure
```typescript
interface PlayoffGame {
  id: string
  team1: { name: string; seed: number; slug: string; score?: number }
  team2: { name: string; seed: number; slug: string; score?: number }
  date: string
  time: string
  winner?: string // team slug
}
```

### Seeding Rules
- Lower seed from semifinals → faces #1 Knights
- Higher seed from semifinals → faces #2 Panthers

## Notes
- Currently static data (hardcoded in component)
- TBD opponents will be manually updated after semifinal results
- Future version can integrate with Supabase for dynamic updates

