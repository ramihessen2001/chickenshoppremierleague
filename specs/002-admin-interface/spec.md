# Feature Specification: Admin Interface for League Data Management

**Feature Name:** Admin Interface  
**Feature Number:** 002  
**Created:** 2025-12-20  
**Status:** Draft  
**Constitutional Version:** 1.0.0  
**Depends On:** Feature 001 (League Viewer)

---

## Overview

### Purpose

Extend the YM Soccer League application with administrative capabilities that allow authorized league administrators to update game scores, manage statistics, update rosters, and modify schedules. Admin access is protected by password authentication and integrates seamlessly with the existing public viewer interface.

### Target Users

**Primary Users (Administrators)**
- League administrators who manage game data and statistics
- Team managers who need to update team information
- Score keepers who enter game results

**Secondary Users (Public Viewers)**
- Continue to have read-only access to all league information
- Unaffected by admin features unless actively editing data

### Scope

**In Scope:**
- Password-protected admin mode activation via "ADMIN" button
- Simple password authentication (password: `sport2233`)
- Edit game scores and box score statistics
- Update player statistics (goals, assists, saves, yellow/red/blue cards)
- Modify game schedules (dates, times, locations, status)
- Update team rosters (add/remove players, change jersey numbers)
- Manage weekly game assignments
- Visual indicators when in admin mode
- Ability to exit admin mode and return to viewer mode
- All admin changes persist and are immediately visible to public viewers

**Out of Scope (Future Phases):**
- Multi-user admin accounts with different permissions
- Admin user management and account creation
- Change password functionality
- Audit logs and change history
- Bulk data import/export tools
- Advanced statistics and analytics
- Team standings calculations
- Playoff bracket management
- Email notifications for changes
- Mobile-optimized admin interface (desktop-first for admin features)

---

## User Scenarios & Testing

### Scenario 1: Administrator Entering Admin Mode

**Actor:** James, a league administrator who needs to update game scores

**Goal:** Access admin features to enter scores from today's games

**Steps:**
1. James opens the YM Soccer League website
2. He scrolls to the bottom of the page
3. He sees an "ADMIN" button (always visible, unobtrusive)
4. He clicks the "ADMIN" button
5. A password prompt/modal appears
6. He enters the password: `sport2233`
7. The system validates the password
8. Admin mode activates - visual indicators appear (e.g., admin toolbar, edit icons appear on data)
9. James can now edit any data in the application

**Success Outcome:** James successfully enters admin mode and sees edit controls

**Edge Cases:**
- Incorrect password entered (show error message: "Incorrect password. Please try again.", allow retry)
- Empty password field (disable submit button or show validation message)
- Password field visible/exposed (use password input type with masked characters)
- Multiple failed attempts (no lockout in Phase 1, but log attempts)

### Scenario 2: Updating Game Score and Statistics

**Actor:** James, in admin mode, after Eagles vs Panthers game

**Goal:** Enter the final score and player statistics for a completed game

**Steps:**
1. James is in admin mode (visual indicators present)
2. He navigates to the current week's games on the homepage
3. He clicks on "Eagles vs Panthers" game
4. The box score view opens with edit controls visible (pencil icons, edit buttons, or inline editing)
5. He enters the final score: Eagles 5, Panthers 3
6. He adds goal scorers for Eagles:
   - Omar Helmy (2 goals)
   - Yassin Elakhtaby (2 goals)
   - Hamza Alemam (1 goal)
7. He adds goal scorers for Panthers:
   - Rafe Mohammad (2 goals)
   - Safiullah Mohammadi (1 goal)
8. He adds assists for both teams
9. He enters goalkeeper saves for both teams
10. He records any yellow/red/blue cards issued
11. He clicks "Save" or "Update Box Score"
12. System validates the data (score matches goal count, etc.)
13. Changes are saved and immediately visible to public viewers
14. Success message appears: "Box score updated successfully"

**Success Outcome:** Game score and statistics are updated and visible to all users

**Edge Cases:**
- Score doesn't match goal count (show warning: "Total goals (7) doesn't match score. Please verify.")
- Player not found in roster (suggest existing players, allow typing corrections)
- Duplicate statistics entered (allow or prevent based on business rules)
- Navigating away with unsaved changes (show confirmation: "You have unsaved changes. Leave anyway?")
- Save fails due to data issues (show specific error message, preserve entered data for retry)

### Scenario 3: Managing Weekly Game Schedule

**Actor:** James, in admin mode, preparing next week's schedule

**Goal:** Update next week's games with dates, times, and field locations

**Steps:**
1. James is in admin mode
2. He navigates to the Full Season Schedule page
3. He locates "Week 5" section
4. He sees edit controls for each game
5. He clicks "Edit" on "Lions vs Dolphins" game
6. An edit form/modal appears with fields:
   - Date: [date picker]
   - Time: [time picker]
   - Location: [text field]
   - Status: [dropdown: Scheduled/In Progress/Completed/Cancelled]
7. He enters: Date: Jan 15, 2025, Time: 6:00 PM, Location: Field 3
8. He clicks "Save Game"
9. Changes are saved and calendar updates
10. Public viewers immediately see the updated schedule

**Success Outcome:** Game schedule updated with correct date, time, and location

**Edge Cases:**
- Conflicting game times (same field, same time - show warning but allow)
- Past dates for future games (show warning: "This date is in the past. Continue?")
- Invalid time format (validate input, show format example: "6:00 PM")
- Missing required fields (highlight missing fields, prevent save until complete)

### Scenario 4: Updating Team Roster

**Actor:** James, in admin mode, after a player joins mid-season

**Goal:** Add a new player to the Knights roster

**Steps:**
1. James is in admin mode
2. He clicks on the Knights team logo
3. Knights roster page opens with edit controls visible
4. He sees an "Add Player" button
5. He clicks "Add Player"
6. A form appears with fields:
   - Player Name: [text input]
   - Jersey Number: [number input]
7. He enters: "Ali Hassan", Jersey Number: 14
8. He clicks "Add to Roster"
9. System validates (no duplicate jersey numbers on team)
10. New player appears in Knights roster
11. Player is now available for statistics entry in future games

**Success Outcome:** New player added to roster and visible to public viewers

**Edge Cases:**
- Duplicate jersey number on same team (show error: "Jersey number 14 already assigned to [Player Name]. Choose a different number.")
- Invalid player name (very short, special characters - validate or allow with warning)
- Missing required fields (prevent save, highlight missing fields)
- Removing a player with existing statistics (show warning: "This player has game statistics. Archive instead of delete?")

### Scenario 5: Exiting Admin Mode

**Actor:** James, finished updating data, wants to return to viewer mode

**Goal:** Exit admin mode to see the public viewer experience

**Steps:**
1. James is in admin mode (admin indicators visible)
2. He sees an "Exit Admin Mode" button in admin toolbar or header
3. He clicks "Exit Admin Mode"
4. System checks for unsaved changes
5. If no unsaved changes, admin mode exits immediately
6. Admin indicators disappear (toolbar hides, edit icons removed)
7. He now sees the standard public viewer interface
8. He can re-enter admin mode anytime by clicking "ADMIN" button again

**Success Outcome:** James successfully exits admin mode and sees public viewer interface

**Edge Cases:**
- Unsaved changes present (show confirmation: "You have unsaved changes in [Section]. Exit anyway?")
- Admin mode times out (optional security feature - session expires after inactivity)
- Password not required on re-entry (session maintained - until exit or timeout)

---

## Functional Requirements

### FR1: Admin Mode Activation

The application MUST provide admin mode activation:

1. **ADMIN Button Placement**
   - Display "ADMIN" button at the bottom of every page
   - Button should be visible but unobtrusive (small, neutral styling)
   - Button remains accessible in viewer mode and admin mode (changes to "EXIT ADMIN" in admin mode)

2. **Password Authentication**
   - Clicking "ADMIN" button opens password prompt (modal or form)
   - Password input field with masked characters (type="password")
   - Required password: `sport2233` (hardcoded for Phase 1)
   - Case-sensitive password validation
   - "Submit" or "Login" button to authenticate
   - "Cancel" button to close prompt without authenticating

3. **Authentication Validation**
   - On submit, compare entered password to hardcoded value
   - If correct: activate admin mode, close prompt, show success indicator
   - If incorrect: show error message "Incorrect password. Please try again.", clear field, allow retry
   - No attempt limit in Phase 1 (unlimited retries)

4. **Admin Mode Indicators**
   - Display prominent visual indicator that admin mode is active (e.g., admin toolbar at top, colored banner, admin badge)
   - Show "Exit Admin Mode" or "Logout" button clearly visible
   - Edit controls appear throughout the application (edit icons, buttons, inline editing)
   - Maintain admin session across page navigation (unless explicitly exited)

### FR2: Box Score Editing

When in admin mode, the application MUST allow editing box scores:

1. **Access Box Score Edit**
   - Navigate to any game (from homepage or schedule page)
   - Box score view displays edit controls (edit buttons, inline editing, or dedicated edit mode)

2. **Editable Fields**
   - Final score for each team (numeric inputs)
   - Goal scorers: Select player from team roster, add multiple goals per player
   - Assists: Select player from team roster, add multiple assists per player
   - Saves: Select goalkeeper from team roster, enter save count
   - Yellow Cards: Select player(s) from team roster
   - Red Cards: Select player(s) from team roster
   - Blue Cards: Select player(s) from team roster

3. **Player Selection**
   - Dropdown or autocomplete showing players from respective team rosters
   - Allow typing to filter/search players
   - Display player name and jersey number for clarity

4. **Data Validation**
   - Verify total goals entered matches final score (show warning if mismatch)
   - Prevent saving with incomplete required fields (final score mandatory)
   - Validate numeric inputs (no negative numbers, reasonable ranges)

5. **Save and Cancel**
   - "Save" or "Update" button to commit changes
   - "Cancel" button to discard changes and return to view mode
   - Show confirmation message on successful save
   - Show error message if save fails with specific reason

6. **Immediate Visibility**
   - Saved changes immediately visible in public viewer mode
   - Updated statistics reflected in homepage leaderboards
   - Game status changes from "Scheduled" to "Completed" when score entered

### FR3: Schedule Management

When in admin mode, the application MUST allow editing game schedules:

1. **Access Schedule Edit**
   - Navigate to Full Season Schedule page
   - Each game displays edit controls (edit button or inline editing)

2. **Editable Fields per Game**
   - Date: Date picker or text input with validation
   - Time: Time picker or text input with validation
   - Location: Text input (field name, address, field number)
   - Team 1: Dropdown of all teams
   - Team 2: Dropdown of all teams (excluding Team 1)
   - Status: Dropdown (Scheduled, In Progress, Completed, Cancelled, Postponed)
   - Week Number: Numeric input or dropdown

3. **Add New Game**
   - "Add Game" button on schedule page
   - Form with all game fields (date, time, location, teams, week)
   - Validation: prevent same team playing itself, require all fields

4. **Delete Game**
   - "Delete" or "Remove" button for each game
   - Confirmation prompt: "Delete [Team1] vs [Team2] on [Date]? This cannot be undone."
   - Only allow deletion if no box score data entered (or show stronger warning)

5. **Data Validation**
   - Date format validation (YYYY-MM-DD or MM/DD/YYYY)
   - Time format validation (12-hour or 24-hour format)
   - Prevent empty required fields
   - Warn about conflicting schedules (same field, same time) but allow override

6. **Save Changes**
   - "Save" button per game or global "Save Schedule" button
   - Show confirmation on successful save
   - Changes immediately visible in public viewer

### FR4: Roster Management

When in admin mode, the application MUST allow editing team rosters:

1. **Access Roster Edit**
   - Navigate to any team roster page
   - Roster displays edit controls (edit icons, add/remove buttons)

2. **Add Player**
   - "Add Player" button on roster page
   - Form with fields:
     - Player Name (text input, required)
     - Jersey Number (numeric input, required)
   - "Add to Roster" button to save
   - Validation: prevent duplicate jersey numbers on same team, require name and number

3. **Edit Player**
   - Edit icon or button next to each player
   - Inline editing or edit modal with fields:
     - Player Name (editable)
     - Jersey Number (editable)
   - "Save" button to commit changes
   - Validation: same as Add Player

4. **Remove Player**
   - Delete or remove icon/button next to each player
   - Confirmation prompt: "Remove [Player Name] (#[Number]) from roster?"
   - If player has statistics: show warning "This player has game statistics. Remove anyway?"
   - Option to archive instead of delete (future phase)

5. **Data Validation**
   - Player name required (minimum 2 characters)
   - Jersey number required (numeric, typically 1-99, but allow 0-999)
   - No duplicate jersey numbers on same team (show error with existing player name)
   - Handle formatting variations (trim whitespace, handle hyphens/spaces)

6. **Save and Sync**
   - Changes save to data source (update rosters.csv or new data structure)
   - Updated roster immediately visible in public viewer
   - Updated player available in box score editing dropdowns

### FR5: Statistical Leaders Update

The application MUST automatically update statistical leaderboards:

1. **Automatic Calculation**
   - When box score is saved, aggregate statistics across all games for each player
   - Calculate totals for Goals, Assists, and Saves
   - Sort players by statistic value (descending)

2. **Homepage Display**
   - Top 5 Goals leaders updated automatically
   - Top 5 Assists leaders updated automatically
   - Top 5 Saves leaders updated automatically
   - Handle ties: if multiple players tied for 5th place, show all tied players (may exceed 5)

3. **No Manual Override**
   - Leaders are calculated, not manually editable
   - Ensures data consistency
   - If admin needs to correct, they edit the box score source data

### FR6: Admin Mode Persistence and Exit

The application MUST manage admin session state:

1. **Session Persistence**
   - Admin mode remains active across page navigation
   - Use session storage or local storage to maintain admin state
   - Do not require re-authentication when navigating between pages

2. **Exit Admin Mode**
   - "Exit Admin Mode" or "Logout" button always visible in admin mode
   - Clicking exit button checks for unsaved changes
   - If no unsaved changes: immediately exit admin mode, return to viewer
   - If unsaved changes: show confirmation dialog listing unsaved sections

3. **Unsaved Changes Warning**
   - Track which sections have unsaved edits (box scores, schedules, rosters)
   - On exit or navigation, if unsaved changes exist, prompt: "You have unsaved changes. Continue anyway?"
   - Options: "Stay" (cancel exit), "Discard Changes" (exit without saving)

4. **Visual State Changes**
   - Exiting admin mode removes all admin indicators (toolbar, edit icons, buttons)
   - Returning to clean public viewer interface
   - "ADMIN" button remains visible for re-entry

5. **Security Considerations**
   - Admin session expires after 30 minutes of inactivity (optional for Phase 1)
   - Closing browser tab/window ends admin session
   - Password required again on next visit (no persistent login across browser sessions)

### FR7: Admin UI/UX Consistency

When in admin mode, the application MUST maintain usability:

1. **Edit Controls Styling**
   - Edit buttons/icons consistent across all admin interfaces
   - Use recognizable icons (pencil for edit, plus for add, trash for delete)
   - Color coding: edit controls in distinct color (e.g., orange/yellow) to differentiate from public UI

2. **Feedback Messages**
   - Success messages: green background, checkmark icon, auto-dismiss after 3 seconds
   - Error messages: red background, error icon, dismiss on click or after 5 seconds
   - Warning messages: yellow background, warning icon, requires user acknowledgment

3. **Responsive Admin Interface**
   - Admin features optimized for desktop (primary use case)
   - Basic functionality works on tablet
   - Mobile admin editing not prioritized (Phase 1)

4. **Accessibility in Admin Mode**
   - All edit controls keyboard accessible
   - Form fields have labels
   - Error messages announced to screen readers
   - Maintain WCAG AA compliance even in admin interface

---

## Success Criteria

1. **Authentication**: Admin can successfully authenticate with correct password within 5 seconds
2. **Authentication Security**: Incorrect password is rejected with clear error message; unlimited retries allowed
3. **Mode Activation**: Admin mode indicators are clearly visible within 1 second of successful authentication
4. **Edit Access**: All editable data displays edit controls when in admin mode
5. **Box Score Update**: Admin can update complete box score (score + 6 statistics) within 3 minutes
6. **Schedule Update**: Admin can add or edit a game in schedule within 2 minutes
7. **Roster Update**: Admin can add a new player to roster within 1 minute
8. **Data Persistence**: All admin changes save successfully and are immediately visible to public viewers (refresh not required)
9. **Data Validation**: Invalid data is caught with helpful error messages before saving
10. **Unsaved Changes**: System warns admin before losing unsaved changes
11. **Exit Smoothly**: Admin can exit admin mode and return to clean public viewer within 2 clicks
12. **Constitutional Compliance**: Admin interface maintains code simplicity, accessibility, documentation, and visual clarity principles

---

## Key Entities

### AdminSession
- **Attributes:** Authenticated (boolean), Start Time (timestamp), Last Activity (timestamp)
- **Methods:** Validate Password, Activate Mode, Deactivate Mode, Check Timeout

### EditableGame (extends Game from Feature 001)
- **Additional Attributes:** Edit Status (has unsaved changes), Original Values (for cancel/revert)
- **Methods:** Validate Score, Save Changes, Discard Changes

### EditablePlayer (extends Player from Feature 001)
- **Additional Attributes:** Edit Status, Original Values
- **Methods:** Validate Jersey Number, Check Duplicates, Save Changes

### GameStatistic
- **Attributes:** Game ID, Player ID, Statistic Type (Goal/Assist/Save/Yellow/Red/Blue), Count or Occurrence
- **Methods:** Add Statistic, Remove Statistic, Update Count

---

## Data Model Changes

### New Data Structures Needed

**Admin Authentication:**
```typescript
interface AdminSession {
  isAuthenticated: boolean;
  startTime: Date;
  lastActivity: Date;
}
```

**Editable Game Data:**
```typescript
interface EditableGame extends Game {
  editStatus: 'clean' | 'modified' | 'saving' | 'error';
  originalValues?: Game;
  boxScore?: BoxScore;
}

interface BoxScore {
  homeScore: number;
  awayScore: number;
  statistics: GameStatistic[];
}

interface GameStatistic {
  playerId: string;
  playerName: string;
  teamId: string;
  type: 'goal' | 'assist' | 'save' | 'yellow' | 'red' | 'blue';
  count?: number; // for saves, goals, assists
}
```

**Roster Editing:**
```typescript
interface EditableRoster {
  teamId: string;
  players: EditablePlayer[];
  editStatus: 'clean' | 'modified';
}

interface EditablePlayer extends Player {
  editStatus: 'existing' | 'new' | 'modified' | 'deleted';
  originalName?: string;
  originalNumber?: number;
}
```

### Data Persistence Strategy

**Phase 1 Options:**

1. **Option A: Enhanced CSV Files**
   - Continue using CSV for rosters (update rosters.csv on save)
   - Add new CSV files: games.csv, statistics.csv
   - Pros: Simple, consistent with current approach
   - Cons: CSV not ideal for relational data, manual file updates

2. **Option B: JSON Data Files**
   - Migrate to JSON files: rosters.json, games.json, statistics.json
   - Pros: Better structure for nested data, easier parsing
   - Cons: Requires data migration from existing rosters.csv

3. **Option C: Local Storage / Browser Storage**
   - Store all data in browser localStorage
   - Pros: No backend required, instant saves
   - Cons: Data not shared across devices, risk of data loss

4. **Recommended: Option B (JSON Files)** with future database migration
   - Provides structured data for complex relationships
   - Easier to migrate to database in Phase 3
   - Can export/import for backup

---

## Assumptions

1. **Single Admin User**: Only one admin uses the system at a time (no concurrent editing conflicts)
2. **Desktop Primary**: Admin functions primarily used on desktop computers, not mobile devices
3. **Hardcoded Password**: Password `sport2233` is hardcoded and acceptable for Phase 1 amateur league security
4. **Password Sharing**: Password may be shared among multiple trusted league administrators
5. **No User Accounts**: No individual admin accounts or permission levels in Phase 1
6. **Session Duration**: Admin session lasts until explicitly logged out or browser closed (30-minute timeout optional)
7. **Data Backup**: League administrators responsible for backing up data files periodically
8. **No Audit Trail**: Phase 1 does not track who made what changes or when (audit log in future phase)
9. **Trusted Users**: All administrators are trusted; no malicious use expected
10. **Data Validation Only**: System validates data format but trusts admin to enter correct game information
11. **Browser Compatibility**: Admin features work in modern browsers (Chrome, Firefox, Safari, Edge - latest versions)
12. **No Offline Editing**: Admin features require internet connection (if hosted) or local server access

---

## Dependencies

### Requires Feature 001 (League Viewer)
- All public viewer pages and components
- Team roster display
- Box score display
- Schedule display
- Statistical leaders display

### New Dependencies
- Form handling and validation library (or built-in HTML5 validation)
- Data persistence mechanism (JSON file handling or localStorage API)
- Session state management (React Context, Zustand, or similar)

### Optional Dependencies
- Date picker component library (for schedule dates)
- Time picker component library (for schedule times)
- Autocomplete/dropdown component for player selection
- Toast/notification component for feedback messages

---

## Technical Considerations

### Data Flow

1. **Admin Authentication Flow:**
   - User clicks ADMIN → Password prompt appears → User enters password → System validates → Admin mode activates → Edit controls render

2. **Edit and Save Flow:**
   - Admin clicks edit on data item → Edit form/inline edit appears → Admin modifies data → Admin clicks save → System validates → Data persists to file/storage → UI updates → Public viewer reflects changes

3. **Exit Admin Flow:**
   - Admin clicks exit → System checks for unsaved changes → If none, deactivate immediately → If present, show warning → On confirm, discard changes and deactivate

### State Management

- **Admin Session State**: Global state accessible across all pages (authenticated: boolean)
- **Unsaved Changes Tracker**: Object tracking which sections have unsaved edits
- **Edit Mode State**: Per-component state for items being edited (form values, validation errors)

### Security Notes for Phase 1

**Current Security Level (Low):**
- Password transmitted in plain text (client-side validation only)
- No encryption
- No rate limiting on password attempts
- No user account management

**Acceptable for Phase 1 because:**
- Amateur league with trusted administrators
- Low-stakes data (game scores, not financial/personal data)
- Hosted locally or on trusted server
- Physical security (admins work together)

**Future Enhancements (Phase 3+):**
- Backend authentication with hashed passwords
- HTTPS for password transmission
- Admin user accounts with permissions
- Audit logging of all changes
- Password change functionality
- Session timeout enforcement
- Rate limiting on login attempts

---

## UI Mockup Descriptions

### Admin Button (Bottom of Page)
```
[Footer content]
                                    [ADMIN]
```
- Small button, bottom-right corner or centered
- Neutral color (gray), becomes highlighted on hover
- Always visible but unobtrusive

### Password Prompt Modal
```
┌────────────────────────────────┐
│   Admin Authentication         │
│                                │
│   Password: [**********]       │
│                                │
│   [Cancel]  [Submit]           │
└────────────────────────────────┘
```
- Centered modal overlay
- Password field with masked input
- Clear buttons with distinct styling

### Admin Mode Indicator (Top Banner)
```
┌──────────────────────────────────────────────┐
│  🛡️ ADMIN MODE ACTIVE     [Exit Admin Mode]  │
└──────────────────────────────────────────────┘
```
- Orange/yellow banner across top of page
- Admin icon/badge
- Exit button prominently displayed

### Box Score Edit View
```
Eagles 5 vs Panthers 3  [Edit Scores]

Goals:
  Eagles:
    Omar Helmy [×2] [➕] [✏️] [🗑️]
    [+ Add Goal Scorer]
  Panthers:
    Rafe Mohammad [×2] [➕] [✏️] [🗑️]
    [+ Add Goal Scorer]

Assists: ...
Saves: ...
Cards: ...

[Save Box Score]  [Cancel]
```
- Inline editing with add/edit/delete icons per item
- Dropdown to select players
- Save and cancel buttons at bottom

---

## Constitutional Alignment

This specification aligns with the YM Soccer League Application Constitution (v1.0.0):

**Code Simplicity**: Admin features built as extensions of existing components. Edit controls are simple toggle states. Form validation is straightforward. Password check is single comparison.

**Accessibility First**: All edit controls keyboard accessible. Form fields properly labeled. Error messages announced to screen readers. Admin toolbar accessible via keyboard. Tab order logical in edit forms.

**Documentation Excellence**: Each admin function documented with clear purpose. Form fields have helpful labels and placeholders. Error messages specific and actionable. Inline help text for complex fields (e.g., date format examples).

**User-Centric Navigation**: Admin button always accessible (bottom of every page). Edit controls appear contextually where data is displayed (in-place editing). Exiting admin mode is prominent and simple (2 clicks maximum). No hidden menus or complex navigation for admin features.

**Visual Clarity**: Admin mode indicators are prominent and unmistakable. Edit controls use clear icons (pencil, plus, trash). Success/error messages color-coded and positioned clearly. Form layouts maintain generous whitespace and hierarchy.

**Performance & Responsiveness**: Admin features optimized for desktop (primary use case). Data saves quickly (local file or storage operations). No unnecessary loading states for admin interactions. Public viewer performance unaffected by admin features.

---

## Notes

- This specification describes Phase 1 admin features. Future phases will add multi-user accounts, permissions, audit logs, and advanced data management.
- The hardcoded password approach is acceptable for an amateur league where administrators are known and trusted. Migration to proper authentication in Phase 3.
- Admin interface is desktop-first. Mobile admin editing is a future enhancement.
- Data persistence method (CSV, JSON, localStorage) to be determined during technical planning based on hosting environment and future scalability needs.
- Blue card editing follows same pattern as yellow/red cards since exact consequences are league-specific.
- Integration with Feature 001: Admin features are additive and do not break existing public viewer functionality.
- Admin changes are immediately visible to public viewers - no approval workflow or staging in Phase 1.

---

**End of Specification**

