# Feature Specification: 2025 YM Soccer Winter League Viewer

**Feature Name:** League Viewer  
**Feature Number:** 001  
**Created:** 2025-12-20  
**Status:** Draft  
**Constitutional Version:** 1.0.0

---

## Overview

### Purpose

Create a public-facing web application for the 2025 YM Soccer Winter League that allows fans, players, and families to view league information including weekly game schedules, team rosters, box scores, and statistical leaders. The application serves as the central hub for all league information, making it easy for the community to stay engaged with the league throughout the season.

### Target Users

**Primary Users (Public Viewers)**
- League fans and family members who want to follow games and statistics
- Players who want to check schedules and view team rosters
- Community members interested in the league

**Secondary Users (Administrators)** - Future Phase
- League administrators who need to update game scores and statistics
- Team managers who need to manage rosters

*Note: Phase 1 (this specification) focuses exclusively on the public viewer experience. Administrative features will be addressed in a future specification.*

### Scope

**In Scope:**
- Display league branding and identity (league logo, league name)
- Show current week's game schedule on homepage
- Provide full season schedule page showing all weeks and games
- Display all six team logos with navigation to team pages
- Show team rosters with player names and jersey numbers
- Display box scores for completed games with all six tracked statistics (goals, assists, saves, yellow cards, red cards, blue cards)
- Show top 5 statistical leaders in three categories: Goals, Assists, and Saves
- Responsive design for mobile, tablet, and desktop viewing
- Use hardcoded sample data for games and statistics in Phase 1

**Out of Scope (Future Phases):**
- Administrative interface for updating scores and statistics
- User authentication and login
- Historical game archives (previous seasons)
- Player profiles with detailed statistics
- Live game updates or real-time scoring
- Social features (comments, sharing, notifications)
- Team standings and playoff brackets

---

## Clarifications

### Session 2025-12-20

- Q: How should the application determine which week is "current" when displaying weekly games on the homepage? → A: System date only - Calculate based on a hardcoded league start date (e.g., if start date is Jan 1 and today is Jan 8, show Week 2)
- Q: How should box scores be displayed when a user clicks on a game? → A: Display as a modal/overlay on top of current page (dismissible, stays on same page)
- Q: When multiple players are tied for 5th place in statistical leaders, how many total players should be displayed? → A: Put tied players in one line
- Q: What specific metric defines acceptable homepage load time performance? → A: Time to Interactive (TTI) < 3 seconds on 3G connection
- Q: How should the application handle displaying games that are currently "In Progress" (between scheduled and completed states)? → A: Treat as "Scheduled" until marked complete (no in-progress state displayed to users)

---

## User Scenarios & Testing

### Scenario 1: Fan Checking This Week's Games

**Actor:** Maria, a parent whose son plays for the Eagles

**Goal:** Find out when and where her son's team plays this week

**Steps:**
1. Maria opens the YM Soccer League website on her phone
2. She immediately sees the current week's games displayed prominently under the league banner
3. She identifies her son's team (Eagles) in the schedule
4. She notes the game time, opponent, and location

**Success Outcome:** Maria knows when to arrive at the field to watch the game

**Edge Cases:**
- No games scheduled for the current week (display message: "No games scheduled this week")
- Week number changes (application should automatically show current week)

### Scenario 2: Viewing a Game's Box Score

**Actor:** Ahmed, a Dolphins player who just finished a game

**Goal:** See the final score and statistics from the game he just played

**Steps:**
1. Ahmed opens the website on his phone
2. He sees the current week's games listed
3. He taps/clicks on his team's completed game
4. A box score appears showing final score, goal scorers, assists, and saves
5. He sees his name listed with his goal and assist

**Success Outcome:** Ahmed can see the official game results and his individual contributions

**Edge Cases:**
- Game hasn't been played yet (box score not available - show message: "Game not yet played")
- Game data incomplete (treat as scheduled until complete data is available; no partial scores displayed)

### Scenario 3: Exploring Team Rosters

**Actor:** Fatima, a Knights fan who wants to learn player names

**Goal:** View the complete Knights roster with jersey numbers

**Steps:**
1. Fatima opens the website
2. She scrolls past the week's games to the team logos section
3. She clicks/taps the Knights logo
4. The Knights roster page opens showing all players with their jersey numbers
5. She browses the list to learn player names

**Success Outcome:** Fatima can identify players by name and number during games

**Edge Cases:**
- Team has incomplete roster data (display available players, note roster incomplete)
- Player has no jersey number (display name only, number shown as "TBD")

### Scenario 4: Checking Statistical Leaders

**Actor:** Omar, a casual fan interested in top performers

**Goal:** See who the league's top scorers and goalkeepers are

**Steps:**
1. Omar visits the website
2. He scrolls to the bottom of the homepage
3. He sees three columns showing top 5 leaders in Goals, Assists, and Saves
4. He recognizes some players from games he's attended
5. He checks back weekly to see if rankings have changed

**Success Outcome:** Omar stays engaged with the league by following top performers

**Edge Cases:**
- Tied statistics (display tied players together on one line, comma-separated: "3 - Ahmed Hassan, Omar Ali")
- No statistics yet (early season - display message: "Statistics available after games begin")
- Fewer than 5 players with statistics (display all available players)

### Scenario 5: Viewing Full Season Schedule

**Actor:** Sarah, a team manager planning transportation for her team

**Goal:** View all games for the season to coordinate carpools and notify parents

**Steps:**
1. Sarah opens the website
2. She clicks the "Full Season Schedule" link from the homepage
3. The full schedule page opens showing all weeks
4. She scrolls through the season, noting her team's (Panthers) game dates and times
5. She takes screenshots to share with parents

**Success Outcome:** Sarah has a complete view of the season schedule for planning purposes

**Edge Cases:**
- Long season with many weeks (page should handle scrolling smoothly)
- Games rescheduled or cancelled (show updated status and information)
- Current week highlighted to help orient users in the season timeline

---

## Functional Requirements

### FR1: Homepage Layout

The homepage MUST display the following components in order from top to bottom:

1. **League Header**
   - League logo displayed prominently on both left and right sides
   - League name "YM JAX SOCCER LEAGUE" centered
   - Gold/tan colored horizontal divider below header

2. **Weekly Games Section**
   - Section title "WEEKS GAMES" (note: grammatically as shown in mockup)
   - Display current week's scheduled games
   - Each game shows: Team 1 vs Team 2 (team names displayed)
   - Games are clickable to view box scores
   - Include link/button to "Full Season Schedule" page

3. **Team Logos Section**
   - Display all six team logos: Eagles, Panthers, Lions, Dolphins, Knights, Warriors
   - Logos arranged in two rows (4 on top row, 3 on bottom row as shown in mockup)
   - Each logo is clickable and navigates to team roster page
   - Team names displayed with logos

4. **Statistical Leaders Section**
   - Gold/tan colored horizontal divider above section
   - Three columns: "GOALS LEADERS", "ASSISTS LEADERS", "SAVES LEADERS"
   - Display top 5 players in each category
   - Show player name with stat value (e.g., "5 - John Smith")
   - When players are tied, display them together on one line separated by commas (e.g., "3 - Ahmed Hassan, Omar Ali")

### FR2: Team Roster Display

When a user clicks on a team logo, the application MUST:

1. Navigate to a dedicated team roster page
2. Display the team name and logo prominently
3. Show complete roster from rosters.csv data
4. Display each player with their jersey number in format: "Name - Number" or "Name Number"
5. Parse roster data correctly handling various formats (spaces, dashes)
6. Provide navigation back to homepage

**Roster Data Format (from rosters.csv):**
- Row 1: Team names (Eagles, Panthers, Lions, Dolphins, Knights, Warriors)
- Rows 2-10: Players listed by column (each column represents one team)
- Player format examples: "Omar Helmy-7", "Rafe Mohammad 5", "Adam Abu Maali - 12"

### FR7: Full Season Schedule Page

The application MUST provide a dedicated full season schedule page that:

1. Is accessible from the homepage via a clearly labeled link (e.g., "Full Season Schedule", "View All Games")
2. Displays all games for the entire season organized by week
3. Shows each week as a distinct section with week number (e.g., "Week 1", "Week 2")
4. For each game, displays:
   - Team matchup (Team 1 vs Team 2)
   - Date and time
   - Location/field information (if available)
   - Game status (Scheduled or Completed)
   - Final score (for completed games only)
5. Makes each game clickable to view its box score (completed games only; scheduled games show "Game not yet played" message)
6. Highlights or indicates the current week visually
7. Provides navigation back to homepage
8. Maintains responsive design across all device sizes

### FR3: Box Score Display

When a user clicks on a game from the weekly schedule, the application MUST:

1. Display a modal/overlay on top of the current page (does not navigate away)
2. Show final score (e.g., "Eagles 5 - Panthers 3")
3. Display detailed game statistics for each team:
   - Goal scorers (player names)
   - Assists (player names)
   - Saves (goalkeeper names)
   - Yellow cards (player names)
   - Red cards (player names)
   - Blue cards (player names)
4. Organize statistics by team for easy comparison
5. Provide clear dismissal mechanism (X button, click outside modal, ESC key)
6. Handle games with no score data (display message: "Game not yet played")
7. Ensure modal is accessible (focus trap, keyboard navigation, ARIA attributes)

### FR4: Responsive Design

The application MUST:

1. Function correctly on mobile devices (minimum 375px width)
2. Function correctly on tablets (768px - 1024px width)
3. Function correctly on desktop displays (1024px and wider)
4. Adapt layout appropriately for each screen size:
   - Mobile: Single column layout, stacked components, hamburger menu if needed
   - Tablet: Adjusted grid layouts, optimized spacing
   - Desktop: Full multi-column layout as shown in mockup
5. Maintain readability and usability across all device sizes
6. Optimize team logo sizing and arrangement for different screens

### FR5: Visual Design & Branding

The application MUST:

1. Use the provided team logos:
   - Eagles logo (eagle with Y.M.J. shield design)
   - Panthers logo (panther silhouette circular design)
   - Lions logo (lion with architectural elements)
   - Dolphins logo (dolphin wave design)
   - Knights logo (knight archer shield design)
   - Warriors logo (warrior helmet circular design)
   - League logo (ICNEF Winter League rooster design)

2. Implement color scheme matching the mockup:
   - Dark background (black/dark navy gradient)
   - Gold/tan accent colors for dividers and highlights
   - White text for primary content
   - Light blue accent for secondary elements

3. Maintain consistent typography and spacing
4. Ensure logos are displayed clearly and at appropriate sizes
5. Use the gold horizontal dividers to separate major sections

### FR6: Data Management

The application MUST:

1. Parse roster data from `league_data/rosters.csv` file
2. Load team logos from `league_data/images/` directory
3. Use hardcoded sample data for Phase 1:
   - Sample game schedules with team matchups and times
   - Sample box score statistics (goals, assists, saves, cards)
   - Sample player statistics for leaderboards
4. Structure sample data to be easily replaceable with real data source in future phases
5. Handle missing or incomplete data gracefully
6. Display appropriate messages when data is unavailable

*Note: Hardcoded sample data allows immediate UI development. Future phases will implement a real data management system (admin interface, database, or file-based updates).*

---

## Success Criteria

1. **Usability**: Users can find their team's weekly game within 5 seconds of page load
2. **Navigation**: Any team roster is accessible within 2 clicks from homepage (adhering to constitutional navigation principle)
3. **Schedule Access**: Full season schedule is accessible within 2 clicks from homepage
4. **Readability**: All text is readable without zooming on mobile devices (minimum 16px font size per constitution)
5. **Performance**: Homepage Time to Interactive (TTI) is under 3 seconds on 3G connection (measured using Chrome DevTools or Lighthouse with "Slow 3G" throttling profile)
6. **Accessibility**: All interactive elements (logos, game links, schedule links) are keyboard navigable and have appropriate ARIA labels (per constitutional accessibility principle)
7. **Data Accuracy**: Team rosters display all players from rosters.csv with correct names and jersey numbers (95% accuracy minimum)
8. **Box Score Completeness**: Box scores display all six tracked statistics (goals, assists, saves, yellow cards, red cards, blue cards) in an organized format
9. **Cross-Device**: Application functions correctly on mobile, tablet, and desktop with no horizontal scrolling
10. **Visual Consistency**: Design matches provided mockup with appropriate use of branding colors and logos

---

## Key Entities

### Team
- **Attributes:** Team Name, Logo Image, Roster (collection of Players)
- **Teams:** Eagles, Panthers, Lions, Dolphins, Knights, Warriors

### Player
- **Attributes:** Name, Jersey Number, Team, Statistics (Goals, Assists, Saves)
- **Source:** rosters.csv file

### Game
- **Attributes:** Week Number, Team 1, Team 2, Date/Time, Location, Score (when completed), Box Score Details
- **States:** Scheduled (not yet played or in progress), Completed (final score and statistics available)
- **Box Score Details:** Goals, Assists, Saves, Yellow Cards, Red Cards, Blue Cards (all tracked by player)
- **Note:** Games are treated as "Scheduled" until fully completed with final data; no intermediate "In Progress" state is displayed to users

### Statistic
- **Types:** 
  - Goals (offensive stat - scoring)
  - Assists (offensive stat - helping score)
  - Saves (goalkeeper stat - preventing goals)
  - Yellow Cards (disciplinary - caution)
  - Red Cards (disciplinary - ejection)
  - Blue Cards (disciplinary - special league rule)
- **Attributes:** Player, Statistic Type, Value (count)

---

## Assumptions

1. **Current Week Determination**: The application will calculate "current week" using the system date relative to a hardcoded league start date constant (e.g., `LEAGUE_START_DATE = "2025-01-01"`). Week number = floor((current date - start date) / 7) + 1. This provides automatic week progression without manual configuration updates.
2. **League Schedule**: Six teams suggest a round-robin format; exact schedule structure will be defined in sample data
3. **Game Locations**: Physical field locations exist; format (address, field number, etc.) included in sample data
4. **Statistics Tracking**: Six statistics are tracked per game:
   - Goals (player scored a goal)
   - Assists (player assisted on a goal)
   - Saves (goalkeeper saved a shot)
   - Yellow Cards (player received caution)
   - Red Cards (player was ejected)
   - Blue Cards (league-specific disciplinary card)
5. **Blue Card Rule**: Blue card is a league-specific rule (not standard soccer); exact meaning/consequence to be documented in future admin specification
6. **Sample Data Structure**: Phase 1 uses hardcoded sample data; structure designed to be easily replaced with dynamic data source in Phase 2
7. **Season Duration**: Winter league implies a fixed-length season (approximately 8-12 weeks)
8. **Static Content**: Phase 1 uses static or hardcoded data; database integration and admin updates are future enhancements
9. **Single League**: Application serves only the 2025 YM Soccer Winter League (not multi-league)
10. **English Language**: All content displayed in English
11. **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
12. **No Real-Time Updates**: Scores and statistics update on page refresh, not live/real-time

---

## Dependencies

### Data Files
- `league_data/rosters.csv` - Team rosters with player names and numbers
- `league_data/images/*.png` - Team and league logos

### External Assets
- Team logo images (provided)
- League logo image (provided)

### Future Dependencies (Out of Scope for Phase 1)
- Dynamic data source for game schedules and statistics (Phase 2)
- Administrative interface for data updates (Phase 2)

---

## Constitutional Alignment

This specification aligns with the YM Soccer League Application Constitution (v1.0.0):

**Code Simplicity**: Feature broken into clear, independent components (homepage, roster pages, box scores). Each component has a single, well-defined purpose.

**Accessibility First**: All interactive elements (team logos, game links) specified as keyboard navigable with ARIA labels. Color contrast requirements explicitly stated in visual design. Success criteria includes accessibility validation.

**Documentation Excellence**: Specification includes comprehensive edge cases, data format examples, and clear assumptions. Each requirement is unambiguous and testable.

**User-Centric Navigation**: 2-click rule enforced (homepage → team logo → roster; homepage → game → box score). Clear navigation paths specified for all user scenarios.

**Visual Clarity**: Minimum 16px font size specified. Visual hierarchy clearly defined with section ordering and dividers. Design mockup colors and spacing documented.

**Performance & Responsiveness**: 3-second load time specified. Responsive breakpoints defined (375px mobile, 768px tablet, 1024px+ desktop). Logo optimization implied through Next.js Image component usage in implementation.

---

## Notes

- This specification covers Phase 1 (public viewer) only. Administrative features (updating scores, managing rosters, adding games) will be addressed in a separate specification (Feature 002 or later).
- The grammatically unusual "WEEKS GAMES" (without apostrophe) is intentional to match the provided mockup design.
- Team roster data includes some formatting variations (dashes, spaces) that must be handled during parsing.
- The mockup shows 7 team slots but rosters.csv has 6 teams; specification uses the CSV as source of truth (6 teams).
- **Blue Card**: This is a league-specific disciplinary card that is not standard in traditional soccer rules. The exact consequences and meaning will be documented when the admin interface is specified.
- **Sample Data in Phase 1**: Hardcoded sample data allows immediate UI/UX development without waiting for data infrastructure. Structure should be designed with future data sources in mind (easy to swap out for API calls, database queries, or file imports).
- **Six Statistics Tracked**: Goals, Assists, Saves (displayed in homepage leaderboards) plus Yellow Cards, Red Cards, Blue Cards (displayed only in box scores).

---

**End of Specification**

