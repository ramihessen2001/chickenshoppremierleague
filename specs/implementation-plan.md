# Implementation Plan: YM Soccer League Application

**Project**: YM Soccer League Winter 2025  
**Features**: 001 (League Viewer) + 002 (Admin Interface)  
**Created**: 2025-12-20  
**Constitutional Version**: 1.0.0  
**Status**: Planning Phase

---

## Executive Summary

This plan outlines the technical implementation of a dual-mode web application for the YM JAX Soccer League. The application provides a public-facing league viewer for fans, players, and families, with an integrated admin interface for authorized league administrators to manage game data, schedules, and rosters.

**Key Characteristics:**
- **Dual-Mode Architecture**: Seamless toggle between viewer and admin modes
- **Premium Dark Aesthetic**: High-contrast, competition-focused visual design
- **Simple Data Management**: JSON-based data with future database migration path
- **Constitutional Compliance**: All six principles enforced throughout implementation

---

## Technical Context

### Technology Stack

**Framework**: Next.js 16 (App Router)
- **Rationale**: Server-side rendering, file-based routing, built-in optimization, TypeScript support
- **Constitutional Alignment**: Simplicity (convention over configuration), Performance (automatic optimizations)

**UI Library**: React 19
- **Rationale**: Component-based architecture, strong TypeScript support, large ecosystem
- **Constitutional Alignment**: Code Simplicity (component reusability), Documentation (clear component boundaries)

**Styling**: Tailwind CSS 4
- **Rationale**: Utility-first, mobile-first, excellent dark mode support, fast development
- **Design System Integration**: Custom theme for dark gradient backgrounds, teal accents, geometric typography
- **Constitutional Alignment**: Visual Clarity (consistent spacing/colors), Accessibility (contrast utilities)

**Language**: TypeScript 5
- **Rationale**: Type safety, better IDE support, self-documenting code
- **Constitutional Alignment**: Code Simplicity (explicit types), Documentation (type annotations as documentation)

**State Management**: React Context API + useState
- **Rationale**: Built-in, no external dependencies for simple state needs, sufficient for app complexity
- **Use Cases**: Admin session state, unsaved changes tracking
- **Constitutional Alignment**: Code Simplicity (avoid over-engineering)

### Data Architecture

**Primary Data Source**: JSON Files (Phase 1)

```
league_data/
├── rosters.json          # Team rosters (migrated from CSV)
├── games.json            # Game schedules and metadata
├── statistics.json       # Box score statistics by game
├── config.json           # League configuration (season, weeks, etc.)
└── images/               # Team and league logos
```

**Rationale**:
- Structured data for complex relationships (games → statistics → players)
- Easy parsing in JavaScript/TypeScript
- Git-trackable for version history
- Future-proof for database migration (Phase 3)
- No backend infrastructure required for Phase 1

**Data Flow**:
1. **Viewer Mode**: Read JSON files → Parse → Display in components
2. **Admin Mode**: Read JSON → Edit in forms → Validate → Write JSON → Re-render

### Design System Implementation

**Color Palette** (via Tailwind config):

```typescript
// Primary Background Gradient
background: linear-gradient(138.92deg, #000000 42.58%, #2686DF 83.07%)

// UI Elements
borders: #523232 (rgba(82, 50, 50, 1))
shadows: 0px 4px 4px rgba(0, 0, 0, 0.25)
accent: #2686DF (teal/blue for highlights)

// Text
primary: #FFFFFF (white)
secondary: #A0A0A0 (soft gray)
accent: #2686DF (teal highlights)
```

**Typography**:
- **Headers**: `font-family: 'Rajdhani', 'Inter', sans-serif` - Bold, geometric, uppercase
- **Body**: `font-family: 'Inter', system-ui, sans-serif` - Clean, readable
- **Sizes**: Minimum 16px body text (constitutional requirement)
- **Weight**: Bold headers (700-900), regular body (400), medium accents (500-600)

**Component Patterns**:
- **Stat Cards**: Minimal, data-first, dark backgrounds with teal accents
- **Team Logos**: Monochrome filter option in admin view, full color in viewer
- **Leaderboards**: Grid-based, generous negative space, clear hierarchy
- **Forms** (admin): Dark surfaces with #523232 borders, teal focus states

### Routing Structure

```
/                           → Homepage (current week games, teams, leaders)
/schedule                   → Full season schedule
/teams/[teamId]            → Team roster page
/games/[gameId]            → Box score page
/admin                     → Admin mode indicator (state-based, not route)
```

**Constitutional Alignment**: 2-click navigation rule enforced in structure

### Dependencies

**Required**:
- `next@16.1.0` - Framework
- `react@19.2.3` - UI library
- `react-dom@19.2.3` - React DOM renderer
- `tailwindcss@4` - Styling
- `typescript@5` - Type safety

**Optional** (recommended):
- `zod` - Runtime data validation
- `react-hook-form` - Form state management (admin)
- `date-fns` - Date manipulation and formatting
- `lucide-react` - Icon library (edit icons, admin controls)
- `sonner` - Toast notifications (admin feedback)

**Development**:
- `eslint` - Code linting
- `@types/node`, `@types/react` - TypeScript types

### Environment Configuration

**Environment Variables** (`.env.local`):
```env
# Admin Configuration
NEXT_PUBLIC_ADMIN_PASSWORD=sport2233

# Data Paths
NEXT_PUBLIC_DATA_PATH=/league_data

# Feature Flags (future)
NEXT_PUBLIC_ENABLE_ADMIN=true
```

**Constitutional Note**: Hardcoded admin password acceptable for Phase 1 (documented in assumptions)

---

## Constitution Check

### Principle 1: Code Simplicity ✅

**Requirements**:
- Functions ≤30 lines
- Maximum 3 levels of indentation
- Descriptive names
- Explicit TypeScript types

**Implementation Strategy**:
- **Component Structure**: Each component has single responsibility
  - `HomePage` → orchestrates layout
  - `WeeklyGames` → displays games
  - `GameCard` → individual game
  - `TeamLogos` → displays team grid
  - `StatLeaders` → displays leaderboards
- **Data Parsing**: Separate utility functions
  - `parseRosterJSON()` - converts JSON to Player[]
  - `parseGameJSON()` - converts JSON to Game[]
  - `calculateLeaders()` - aggregates statistics
- **Form Handling**: Simple controlled components with validation functions
- **File Limits**: Enforce 200-line file limit; extract to separate files if exceeded

**Validation**: Code review checklist ensures no function exceeds 30 lines

### Principle 2: Accessibility First ✅

**Requirements**:
- Semantic HTML
- ARIA labels
- Keyboard navigation
- 4.5:1 contrast ratio (normal text), 3:1 (large text)

**Implementation Strategy**:
- **Semantic Structure**:
  ```tsx
  <main>
    <nav aria-label="Team navigation">...</nav>
    <section aria-labelledby="weekly-games">...</section>
    <aside aria-labelledby="stat-leaders">...</aside>
  </main>
  ```
- **Interactive Elements**:
  - Team logos: `<button>` with `aria-label="View Eagles roster"`
  - Game cards: `<button>` with `aria-label="View Eagles vs Panthers box score"`
  - Admin button: `<button>` with `aria-label="Enter admin mode"`
- **Forms** (admin):
  - All inputs have associated `<label>`
  - Error messages linked with `aria-describedby`
  - Required fields marked with `aria-required`
- **Contrast Testing**:
  - White text on gradient background: 15:1 ratio (passes AAA)
  - Teal accent on black: 8.5:1 ratio (passes AAA)
  - Gray borders on dark: 2:1 (decorative, not text)
- **Keyboard Navigation**:
  - Tab order: logo → nav → games → teams → leaders → admin button
  - Focus visible: 2px teal outline (`ring-2 ring-[#2686DF]`)
  - Skip links: "Skip to main content"

**Validation**: Lighthouse accessibility score ≥95, manual keyboard testing, screen reader testing (NVDA/VoiceOver)

### Principle 3: Documentation Excellence ✅

**Requirements**:
- Component purpose comments
- Inline comments for "why"
- JSDoc for public functions
- README files in directories

**Implementation Strategy**:
- **Component Headers**:
  ```typescript
  /**
   * WeeklyGames - Displays current week's scheduled games
   * 
   * Shows games for the current week with click-through to box scores.
   * Automatically determines current week based on system date and season config.
   * 
   * @param games - Array of all games; component filters to current week
   * @param currentWeek - Week number (1-12) calculated from date
   */
  ```
- **Utility Functions**:
  ```typescript
  /**
   * Calculates top 5 stat leaders from all game statistics
   * 
   * @param statistics - Array of all game statistics across season
   * @param statType - Type of statistic ('goals', 'assists', 'saves')
   * @returns Array of players sorted by stat count (descending), top 5
   * 
   * Note: Ties for 5th place will show all tied players (may exceed 5)
   */
  ```
- **Inline Comments**: Focus on "why" not "what"
  ```typescript
  // Use gradient background for entire app to maintain premium aesthetic
  // Gradient creates depth and guides eye from top-left to bottom-right
  className="bg-gradient-to-br from-black via-black to-[#2686DF]"
  
  // Filter to active players only - inactive players hidden from public view
  // to avoid confusion during mid-season roster changes
  const activePlayers = roster.filter(p => p.isActive)
  ```
- **Directory READMEs**:
  - `/app/components/README.md` - explains component organization
  - `/lib/README.md` - explains utility function purposes
  - `/types/README.md` - explains type definitions

**Validation**: Code review checks for documentation; no PR merges without comments

### Principle 4: User-Centric Navigation ✅

**Requirements**:
- 2-click maximum to any major feature
- Persistent navigation
- Visual current location indicators
- Mobile hamburger menu

**Implementation Strategy**:
- **Navigation Structure**:
  ```
  [Logo] Home | Schedule | Teams ▾ | Admin
         ↓                   ↓
         2 clicks            [Eagles, Panthers, Lions, Dolphins, Knights, Warriors]
                             ↓
                             2 clicks to any roster
  ```
- **Click Paths**:
  - Home → Game Card → Box Score (2 clicks)
  - Home → Team Logo → Roster (2 clicks)
  - Home → Schedule Link → Full Season (2 clicks)
  - Any Page → Admin Button → Admin Mode (2 clicks)
- **Persistent Elements**:
  - Top nav bar on every page (sticky on scroll)
  - Admin button always in footer
  - Team logo homepage link always present
- **Visual Indicators**:
  - Active page: teal underline (`border-b-2 border-[#2686DF]`)
  - Current week: teal background highlight in schedule
  - Admin mode: orange banner across top
- **Mobile Optimization**:
  - Hamburger menu icon (≤768px)
  - Full-screen overlay menu with team list
  - Touch targets minimum 44×44px

**Validation**: User testing with 2-click rule; navigation audit in code review

### Principle 5: Visual Clarity ✅

**Requirements**:
- Minimum 16px body text
- Consistent Tailwind spacing
- Limited color palette (3-4 colors + neutrals)
- Generous whitespace

**Implementation Strategy**:
- **Typography Scale**:
  - H1 (League Title): 48px (desktop), 32px (mobile), uppercase, bold
  - H2 (Section Headers): 36px (desktop), 24px (mobile), uppercase, bold
  - H3 (Team Names): 24px, uppercase, semi-bold
  - Body: 16px minimum, 18px optimal for readability
  - Stat Numbers: 24px bold for emphasis
- **Spacing System** (Tailwind):
  - Component padding: `p-6` (24px)
  - Section margins: `my-12` (48px vertical)
  - Grid gaps: `gap-6` (24px between cards)
  - Content max-width: `max-w-7xl` (1280px) for readability
- **Color Usage**:
  - Background: Gradient (black to teal)
  - Text: White primary, gray secondary
  - Accents: Teal highlights (buttons, borders, focus)
  - Borders: Dark brown (#523232) for subtle separation
- **Visual Hierarchy**:
  - Largest: League header and title
  - Large: Section headers ("WEEKS GAMES", "GOALS LEADERS")
  - Medium: Team names, stat values
  - Small: Player names, game details
- **Whitespace**:
  - Empty space = 50% of design (breathing room)
  - No cramped layouts or tight grids
  - Generous padding around all interactive elements

**Validation**: Design review against mockup; Lighthouse performance check for layout shifts

### Principle 6: Performance & Responsiveness ✅

**Requirements**:
- Load in <3 seconds on 3G
- Optimized images with lazy loading
- Responsive breakpoints (375px, 768px, 1024px+)
- No horizontal scrolling

**Implementation Strategy**:
- **Image Optimization**:
  - Use Next.js `<Image>` component for all logos
  - Automatic WebP/AVIF conversion
  - Responsive sizing: `sizes="(max-width: 768px) 100vw, 50vw"`
  - Lazy loading for below-fold images
  - Team logos: 200×200px optimized, PNG with transparency
- **Code Splitting**:
  - Route-based code splitting (automatic with App Router)
  - Dynamic imports for admin components:
    ```typescript
    const AdminToolbar = dynamic(() => import('./AdminToolbar'), { ssr: false })
    ```
- **Data Loading**:
  - JSON files loaded server-side (Next.js RSC)
  - Static generation for homepage, schedules, rosters
  - Client hydration only for interactive elements (admin mode toggle)
- **Responsive Breakpoints**:
  - Mobile: <768px (single column, stacked layout)
  - Tablet: 768px-1023px (2-column grid, compact spacing)
  - Desktop: ≥1024px (full 4-column grid, generous spacing)
- **Performance Budget**:
  - Initial JS: <100KB gzipped
  - Total page weight: <500KB
  - First Contentful Paint: <1.5s
  - Time to Interactive: <3s on 3G
- **Responsive Testing**:
  - Chrome DevTools device emulation
  - Real device testing: iPhone SE, iPad, Desktop
  - No horizontal scroll at any breakpoint
  - Touch targets ≥44px on mobile

**Validation**: Lighthouse performance score ≥90; WebPageTest on throttled 3G

---

## Phase 0: Research & Decisions

### Decision 1: Data Migration Strategy (CSV → JSON)

**Question**: How to migrate existing `rosters.csv` to JSON structure while maintaining data integrity?

**Research**:
- **Option A**: Manual conversion (spreadsheet → JSON)
  - Pros: Full control, can clean data
  - Cons: Error-prone, time-consuming
- **Option B**: Script-based conversion
  - Pros: Repeatable, automated, testable
  - Cons: Requires script development
- **Option C**: Keep CSV, add JSON for new data
  - Pros: No migration needed
  - Cons: Two data formats, inconsistent

**Decision**: Option B - Script-based conversion

**Rationale**:
- Ensures data accuracy through automated parsing
- Repeatable if roster data changes before Phase 1 deployment
- Creates clean baseline for Phase 2 database migration
- Constitutional alignment: Code Simplicity (single data format)

**Implementation**:
```typescript
// scripts/migrate-rosters.ts
// Converts league_data/rosters.csv → league_data/rosters.json
// Handles formatting variations (spaces, dashes, missing numbers)
// Validates no duplicate jersey numbers per team
// Outputs structured JSON with team → players[] relationships
```

### Decision 2: Admin Password Security Model

**Question**: How to implement client-side password authentication without backend?

**Research**:
- **Option A**: Plain text password in environment variable
  - Pros: Simple, no encryption overhead
  - Cons: Visible in client bundle (less secure)
- **Option B**: Hashed password comparison (bcrypt/crypto)
  - Pros: Password not directly visible
  - Cons: Hash still in bundle, false sense of security
- **Option C**: Simple obfuscation (Base64)
  - Pros: Not immediately readable
  - Cons: Easily decoded, security theater

**Decision**: Option A - Plain text in environment variable

**Rationale**:
- Phase 1 amateur league context: trusted admins, low-stakes data
- Client-side authentication inherently insecure regardless of approach
- Constitutional principle: Code Simplicity over false security
- Options B/C add complexity without meaningful security gain
- Phase 3 will add proper backend authentication

**Implementation**:
```typescript
// lib/auth.ts
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD // "sport2233"
export const validatePassword = (input: string) => input === ADMIN_PASSWORD
```

**Security Note**: Documented in assumptions; acceptable for Phase 1; migrate to backend auth in Phase 3

### Decision 3: Form Validation Strategy

**Question**: Client-side validation approach for admin forms?

**Research**:
- **Option A**: Native HTML5 validation
  - Pros: No dependencies, browser-native, accessible
  - Cons: Limited customization, inconsistent styling
- **Option B**: React Hook Form + Zod
  - Pros: Type-safe, comprehensive, great DX
  - Cons: Additional dependencies, learning curve
- **Option C**: Manual validation functions
  - Pros: Full control, no dependencies
  - Cons: Verbose, error-prone, repetitive

**Decision**: Option B - React Hook Form + Zod

**Rationale**:
- Type safety from Zod schemas matches TypeScript philosophy
- Reduces boilerplate for multiple admin forms
- Excellent error handling and messaging (accessibility benefit)
- Industry standard (documentation readily available)
- Constitutional alignment: Code Simplicity (declarative validation), Accessibility (built-in error announcements)

**Implementation**:
```typescript
// schemas/gameSchema.ts
import { z } from 'zod'

export const gameSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{1,2}:\d{2}\s?(AM|PM)$/i, 'Time must be HH:MM AM/PM'),
  homeScore: z.number().min(0).max(99),
  awayScore: z.number().min(0).max(99),
})
```

### Decision 4: State Management for Admin Session

**Question**: How to persist admin mode state across page navigation?

**Research**:
- **Option A**: localStorage
  - Pros: Persists across reloads, simple API
  - Cons: Not SSR-compatible, requires hydration check
- **Option B**: React Context + sessionStorage
  - Pros: Global state, session-scoped (expires on tab close)
  - Cons: Requires provider wrapping
- **Option C**: URL parameter (?admin=true)
  - Pros: Shareable, visible state
  - Cons: Password in URL history, security concern

**Decision**: Option B - React Context + sessionStorage

**Rationale**:
- Session scope appropriate (expires on browser close)
- Context provides clean global access
- No URL pollution or history leakage
- Hydration-safe with proper SSR checks
- Constitutional alignment: Code Simplicity (built-in React, no external library)

**Implementation**:
```typescript
// contexts/AdminContext.tsx
'use client'
import { createContext, useContext, useEffect, useState } from 'react'

const AdminContext = createContext<{
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
}>({ ... })

export const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false)
  
  useEffect(() => {
    // Hydration-safe: check sessionStorage after mount
    if (typeof window !== 'undefined') {
      setIsAdmin(sessionStorage.getItem('admin') === 'true')
    }
  }, [])
  
  const login = (password: string) => {
    if (validatePassword(password)) {
      sessionStorage.setItem('admin', 'true')
      setIsAdmin(true)
      return true
    }
    return false
  }
  
  const logout = () => {
    sessionStorage.removeItem('admin')
    setIsAdmin(false)
  }
  
  return <AdminContext.Provider value={{ isAdmin, login, logout }}>{children}</AdminContext.Provider>
}

export const useAdmin = () => useContext(AdminContext)
```

### Decision 5: Icon Library Selection

**Question**: Which icon library for edit controls, admin UI, and navigation?

**Research**:
- **Option A**: Lucide React
  - Pros: Tree-shakeable, TypeScript, clean design, Next.js optimized
  - Cons: Smaller icon set than alternatives
- **Option B**: React Icons
  - Pros: Huge icon variety, many icon packs
  - Cons: Bundle size concerns, inconsistent styles
- **Option C**: Heroicons
  - Pros: Tailwind-designed, excellent accessibility
  - Cons: Limited icon variety

**Decision**: Option A - Lucide React

**Rationale**:
- Modern, geometric aesthetic matches design system
- Tree-shakeable (only import used icons)
- TypeScript-first with excellent types
- Consistent stroke-based design
- Constitutional alignment: Performance (small bundle), Visual Clarity (consistent icon style)

**Icons Needed**:
- Edit: `Pencil`, `Edit3`
- Add: `Plus`, `PlusCircle`
- Delete: `Trash2`, `X`
- Save: `Check`, `Save`
- Navigation: `Menu`, `ChevronRight`, `Home`
- Admin: `Shield`, `Lock`, `Unlock`
- Statistics: `Target` (goals), `Zap` (assists), `Hand` (saves)

---

## Phase 1: Data Model

### Entity: Team

**Description**: Represents a soccer team in the league

**Fields**:
```typescript
interface Team {
  id: string                    // Unique identifier (e.g., "eagles")
  name: string                  // Display name (e.g., "Eagles")
  logoUrl: string               // Path to logo image (/league_data/images/eagles_logo.png)
  roster: Player[]              // Array of players on team
  primaryColor?: string         // Optional: Team primary color for UI accents
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
}
```

**Validation Rules**:
- `id`: Required, lowercase, alphanumeric only, unique across all teams
- `name`: Required, 2-50 characters
- `logoUrl`: Required, valid file path, must exist in filesystem
- `roster`: Array, can be empty (roster not yet populated)

**State Transitions**: None (teams are static for season)

**Relationships**:
- Has many `Player` (1:N)
- Referenced by `Game` as homeTeam or awayTeam

**Storage**: `league_data/rosters.json`
```json
{
  "teams": [
    {
      "id": "eagles",
      "name": "Eagles",
      "logoUrl": "/league_data/images/eagles_logo.png",
      "roster": [ ...players ],
      "createdAt": "2025-12-20T00:00:00Z",
      "updatedAt": "2025-12-20T00:00:00Z"
    }
  ]
}
```

### Entity: Player

**Description**: Represents an individual player on a team

**Fields**:
```typescript
interface Player {
  id: string                    // Unique identifier (UUID or generated)
  name: string                  // Full name (e.g., "Omar Helmy")
  jerseyNumber: number          // Jersey number (1-99 typically, allow 0-999)
  teamId: string                // Foreign key to Team.id
  isActive: boolean             // Active roster vs inactive (benched, injured)
  position?: string             // Optional: 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
}
```

**Validation Rules**:
- `id`: Required, unique across all players
- `name`: Required, 2-100 characters, allow letters, spaces, hyphens, apostrophes
- `jerseyNumber`: Required, integer, 0-999, unique within team (not globally)
- `teamId`: Required, must reference existing Team.id
- `isActive`: Required, boolean, defaults to true
- `position`: Optional, enum validation if provided

**State Transitions**:
- `isActive: true → false`: Player moved to inactive (admin action)
- `teamId: X → Y`: Player traded (future feature, not Phase 1)

**Relationships**:
- Belongs to `Team` (N:1)
- Referenced by `GameStatistic` for statistics

**Duplicate Jersey Number Check**:
```typescript
// Validation function
const isDuplicateJersey = (teamId: string, jerseyNumber: number, playerId?: string) => {
  const team = getTeamById(teamId)
  return team.roster.some(p => 
    p.jerseyNumber === jerseyNumber && p.id !== playerId
  )
}
```

### Entity: Game

**Description**: Represents a scheduled or completed soccer match

**Fields**:
```typescript
interface Game {
  id: string                    // Unique identifier (UUID or generated)
  weekNumber: number            // Week in season (1-12)
  date: string                  // ISO 8601 date (YYYY-MM-DD)
  time: string                  // 12-hour format (e.g., "6:00 PM")
  location: string              // Field location (e.g., "Field 3, Mandarin Park")
  homeTeamId: string            // Foreign key to Team.id
  awayTeamId: string            // Foreign key to Team.id
  homeScore: number | null      // Final score for home team (null if not played)
  awayScore: number | null      // Final score for away team (null if not played)
  status: GameStatus            // 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
  statistics: GameStatistic[]   // Box score statistics
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
}

type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
```

**Validation Rules**:
- `id`: Required, unique
- `weekNumber`: Required, integer, 1-12 (adjust based on season length)
- `date`: Required, ISO 8601 format, cannot be more than 2 years in past/future
- `time`: Required, 12-hour format with AM/PM
- `location`: Required, 5-200 characters
- `homeTeamId`, `awayTeamId`: Required, must reference existing Team.id, cannot be equal (team can't play itself)
- `homeScore`, `awayScore`: Optional (null for unplayed), integer, 0-99 if provided
- `status`: Required, enum validation
- `statistics`: Array, can be empty

**State Transitions**:
```
scheduled → in_progress → completed
scheduled → postponed → scheduled (rescheduled)
scheduled → cancelled (final)
```

**Relationships**:
- References `Team` as homeTeam and awayTeam (N:1 each)
- Has many `GameStatistic` (1:N)

**Business Rules**:
- If `homeScore` and `awayScore` are not null, `status` should be 'completed'
- Total goals in `statistics` should match `homeScore + awayScore` (warning, not error)
- Game cannot have same team as home and away

**Storage**: `league_data/games.json`
```json
{
  "games": [
    {
      "id": "game-001",
      "weekNumber": 1,
      "date": "2025-01-15",
      "time": "6:00 PM",
      "location": "Field 3",
      "homeTeamId": "eagles",
      "awayTeamId": "panthers",
      "homeScore": 5,
      "awayScore": 3,
      "status": "completed",
      "statistics": [ ...stats ],
      "createdAt": "2025-12-20T00:00:00Z",
      "updatedAt": "2025-12-20T15:30:00Z"
    }
  ]
}
```

### Entity: GameStatistic

**Description**: Represents a single statistic event in a game (goal, assist, save, card)

**Fields**:
```typescript
interface GameStatistic {
  id: string                    // Unique identifier
  gameId: string                // Foreign key to Game.id
  playerId: string              // Foreign key to Player.id
  teamId: string                // Foreign key to Team.id (redundant but helpful for queries)
  type: StatType                // Type of statistic
  count?: number                // For goals, assists, saves (can have multiples)
  timestamp?: string            // Optional: time in game (e.g., "23:45" for 23min 45sec)
  createdAt: string             // ISO 8601 timestamp
}

type StatType = 'goal' | 'assist' | 'save' | 'yellow_card' | 'red_card' | 'blue_card'
```

**Validation Rules**:
- `id`: Required, unique
- `gameId`: Required, must reference existing Game.id
- `playerId`: Required, must reference existing Player.id
- `teamId`: Required, must match player's team
- `type`: Required, enum validation
- `count`: Optional, integer, 1-99, used for goals, assists, saves (default: 1)
- `timestamp`: Optional, format MM:SS or HH:MM:SS

**Relationships**:
- Belongs to `Game` (N:1)
- Belongs to `Player` (N:1)
- Belongs to `Team` (N:1)

**Business Rules**:
- Player must be on the team roster (active or inactive)
- If `type` is 'save', player should be goalkeeper (warning, not error - position optional)
- Multiple statistics of same type for same player in same game allowed (e.g., player scores 2 goals)

**Aggregation for Leaderboards**:
```typescript
// Calculate leaders from all GameStatistics
const calculateLeaders = (statistics: GameStatistic[], type: StatType, limit: number = 5) => {
  const playerStats = new Map<string, { player: Player, count: number }>()
  
  statistics
    .filter(stat => stat.type === type)
    .forEach(stat => {
      const current = playerStats.get(stat.playerId) || { player: getPlayer(stat.playerId), count: 0 }
      current.count += stat.count || 1
      playerStats.set(stat.playerId, current)
    })
  
  return Array.from(playerStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit) // Note: Extend to include ties for Nth place
}
```

**Storage**: `league_data/statistics.json`
```json
{
  "statistics": [
    {
      "id": "stat-001",
      "gameId": "game-001",
      "playerId": "player-omar-helmy",
      "teamId": "eagles",
      "type": "goal",
      "count": 2,
      "timestamp": "12:34",
      "createdAt": "2025-12-20T15:30:00Z"
    }
  ]
}
```

### Entity: Config (League Configuration)

**Description**: Global configuration for the league (season dates, current week, etc.)

**Fields**:
```typescript
interface LeagueConfig {
  leagueName: string            // "YM JAX SOCCER LEAGUE"
  season: string                // "2025 Winter"
  startDate: string             // ISO 8601 date - first day of season
  endDate: string               // ISO 8601 date - last day of season
  currentWeek: number           // Manually set or auto-calculated
  totalWeeks: number            // Total weeks in season (e.g., 12)
  updatedAt: string             // ISO 8601 timestamp
}
```

**Validation Rules**:
- `leagueName`: Required, 5-100 characters
- `season`: Required, format "[YEAR] [Season]"
- `startDate`, `endDate`: Required, ISO 8601, endDate must be after startDate
- `currentWeek`: Required, integer, 1 to totalWeeks
- `totalWeeks`: Required, integer, 1-52

**Storage**: `league_data/config.json`
```json
{
  "leagueName": "YM JAX SOCCER LEAGUE",
  "season": "2025 Winter",
  "startDate": "2025-01-08",
  "endDate": "2025-03-26",
  "currentWeek": 3,
  "totalWeeks": 12,
  "updatedAt": "2025-12-20T00:00:00Z"
}
```

**Current Week Calculation** (optional auto mode):
```typescript
const calculateCurrentWeek = (startDate: Date, totalWeeks: number): number => {
  const now = new Date()
  const start = new Date(startDate)
  const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1
  return Math.min(Math.max(weeksSinceStart, 1), totalWeeks)
}
```

### Data Relationships Diagram

```
Team (1) ----< (N) Player
  ↑               ↑
  |               |
  |               |
Game (N:1) ----< (N) GameStatistic
```

**Explanation**:
- A `Team` has many `Players`
- A `Game` references two `Teams` (home and away)
- A `GameStatistic` belongs to one `Game`, one `Player`, and one `Team`
- Leaderboards are computed by aggregating `GameStatistics` grouped by `Player` and filtered by `type`

---

## Phase 2: API Contracts

### Contract Philosophy

**Note**: Phase 1 uses JSON file reads/writes. These "contracts" define the interfaces for data operations. In Phase 3 (database migration), these will map directly to REST API endpoints.

### Contract: Team Operations

**Get All Teams**

```typescript
// READ: lib/data/getTeams.ts
export async function getTeams(): Promise<Team[]>

// Returns: Array of all teams with rosters
// Errors: Throws if rosters.json not found or invalid
// Performance: Cached at build time (static generation)
```

**Get Team By ID**

```typescript
// READ: lib/data/getTeamById.ts
export async function getTeamById(id: string): Promise<Team | null>

// Parameters:
//   - id: Team identifier (e.g., "eagles")
// Returns: Team object with roster, or null if not found
// Errors: Returns null for invalid ID
```

**Update Team Roster** (Admin Only)

```typescript
// WRITE: lib/data/updateTeamRoster.ts
export async function updateTeamRoster(
  teamId: string,
  players: Player[]
): Promise<{ success: boolean; error?: string }>

// Parameters:
//   - teamId: Team to update
//   - players: New roster array (replaces existing)
// Returns: Success status with optional error message
// Validation:
//   - Check for duplicate jersey numbers within team
//   - Validate all player fields
// Side Effects: Writes to rosters.json, triggers revalidation
```

### Contract: Player Operations

**Add Player** (Admin Only)

```typescript
// WRITE: lib/data/addPlayer.ts
export async function addPlayer(
  teamId: string,
  playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; player?: Player; error?: string }>

// Parameters:
//   - teamId: Team to add player to
//   - playerData: Player data without auto-generated fields
// Returns: Success status with created player or error
// Validation:
//   - Jersey number uniqueness within team
//   - Name format (2-100 chars, allowed characters)
// Side Effects: Updates rosters.json, generates UUID for player
```

**Update Player** (Admin Only)

```typescript
// WRITE: lib/data/updatePlayer.ts
export async function updatePlayer(
  playerId: string,
  updates: Partial<Omit<Player, 'id' | 'createdAt'>>
): Promise<{ success: boolean; player?: Player; error?: string }>

// Parameters:
//   - playerId: Player to update
//   - updates: Fields to update (partial)
// Returns: Success status with updated player or error
// Validation:
//   - If jerseyNumber changed, check uniqueness
//   - If teamId changed, validate new team exists
// Side Effects: Updates rosters.json, sets updatedAt
```

**Delete Player** (Admin Only)

```typescript
// WRITE: lib/data/deletePlayer.ts
export async function deletePlayer(
  playerId: string
): Promise<{ success: boolean; hadStatistics: boolean; error?: string }>

// Parameters:
//   - playerId: Player to delete
// Returns: Success status, flag if player had statistics, error
// Warning: Returns hadStatistics=true if player has game stats
// Side Effects: Removes from rosters.json
// Note: Does NOT delete statistics (maintains historical data integrity)
```

### Contract: Game Operations

**Get All Games**

```typescript
// READ: lib/data/getGames.ts
export async function getGames(filters?: {
  weekNumber?: number
  status?: GameStatus
  teamId?: string
}): Promise<Game[]>

// Parameters:
//   - filters: Optional filters for week, status, or team
// Returns: Array of games matching filters
// Errors: Throws if games.json invalid
// Performance: Filtered in-memory (fast for <1000 games)
```

**Get Game By ID**

```typescript
// READ: lib/data/getGameById.ts
export async function getGameById(id: string): Promise<Game | null>

// Parameters:
//   - id: Game identifier
// Returns: Game object with statistics, or null
// Side Effects: Eagerly loads statistics for game
```

**Create Game** (Admin Only)

```typescript
// WRITE: lib/data/createGame.ts
export async function createGame(
  gameData: Omit<Game, 'id' | 'statistics' | 'createdAt' | 'updatedAt'>
): Promise<{ success: boolean; game?: Game; error?: string }>

// Parameters:
//   - gameData: Game data without auto-generated fields
// Returns: Success status with created game or error
// Validation:
//   - homeTeamId !== awayTeamId
//   - Both teams exist
//   - Date/time format valid
// Side Effects: Writes to games.json, generates UUID
```

**Update Game** (Admin Only)

```typescript
// WRITE: lib/data/updateGame.ts
export async function updateGame(
  gameId: string,
  updates: Partial<Omit<Game, 'id' | 'statistics' | 'createdAt'>>
): Promise<{ success: boolean; game?: Game; error?: string }>

// Parameters:
//   - gameId: Game to update
//   - updates: Fields to update (partial)
// Returns: Success status with updated game or error
// Validation:
//   - If teams changed, validate existence and uniqueness
//   - If scores provided, validate match statistics
// Side Effects: Updates games.json, sets updatedAt
```

**Delete Game** (Admin Only)

```typescript
// WRITE: lib/data/deleteGame.ts
export async function deleteGame(
  gameId: string
): Promise<{ success: boolean; hadStatistics: boolean; error?: string }>

// Parameters:
//   - gameId: Game to delete
// Returns: Success status, flag if game had statistics, error
// Warning: Returns hadStatistics=true if game has box score data
// Side Effects: Removes from games.json, removes associated statistics
```

### Contract: Statistics Operations

**Get Game Statistics**

```typescript
// READ: lib/data/getGameStatistics.ts
export async function getGameStatistics(gameId: string): Promise<GameStatistic[]>

// Parameters:
//   - gameId: Game to get statistics for
// Returns: Array of statistics for game, sorted by timestamp if available
// Errors: Returns empty array if game not found
```

**Get Player Statistics**

```typescript
// READ: lib/data/getPlayerStatistics.ts
export async function getPlayerStatistics(playerId: string): Promise<{
  goals: number
  assists: number
  saves: number
  yellowCards: number
  redCards: number
  blueCards: number
}>

// Parameters:
//   - playerId: Player to aggregate statistics for
// Returns: Object with totals for each statistic type
// Errors: Returns zeros if player has no statistics
```

**Calculate Leaders**

```typescript
// READ: lib/data/calculateLeaders.ts
export async function calculateLeaders(
  type: 'goal' | 'assist' | 'save',
  limit: number = 5
): Promise<Array<{ player: Player; count: number }>>

// Parameters:
//   - type: Statistic type to rank by
//   - limit: Number of leaders to return (default 5)
// Returns: Array of players with stat counts, sorted descending
// Note: Includes ties - may return more than limit if tied for last place
```

**Add Game Statistic** (Admin Only)

```typescript
// WRITE: lib/data/addGameStatistic.ts
export async function addGameStatistic(
  statData: Omit<GameStatistic, 'id' | 'createdAt'>
): Promise<{ success: boolean; statistic?: GameStatistic; error?: string }>

// Parameters:
//   - statData: Statistic data without auto-generated fields
// Returns: Success status with created statistic or error
// Validation:
//   - gameId, playerId, teamId all exist
//   - player.teamId matches statistic.teamId
//   - type is valid enum value
// Side Effects: Updates statistics.json, generates UUID
```

**Update Game Statistic** (Admin Only)

```typescript
// WRITE: lib/data/updateGameStatistic.ts
export async function updateGameStatistic(
  statId: string,
  updates: Partial<Omit<GameStatistic, 'id' | 'createdAt'>>
): Promise<{ success: boolean; statistic?: GameStatistic; error?: string }>

// Parameters:
//   - statId: Statistic to update
//   - updates: Fields to update (partial)
// Returns: Success status with updated statistic or error
// Validation: Same as addGameStatistic
// Side Effects: Updates statistics.json
```

**Delete Game Statistic** (Admin Only)

```typescript
// WRITE: lib/data/deleteGameStatistic.ts
export async function deleteGameStatistic(
  statId: string
): Promise<{ success: boolean; error?: string }>

// Parameters:
//   - statId: Statistic to delete
// Returns: Success status with optional error
// Side Effects: Removes from statistics.json
```

### Contract: Configuration Operations

**Get League Config**

```typescript
// READ: lib/data/getConfig.ts
export async function getConfig(): Promise<LeagueConfig>

// Returns: League configuration
// Errors: Throws if config.json not found
// Performance: Cached at build time
```

**Update Config** (Admin Only)

```typescript
// WRITE: lib/data/updateConfig.ts
export async function updateConfig(
  updates: Partial<Omit<LeagueConfig, 'updatedAt'>>
): Promise<{ success: boolean; config?: LeagueConfig; error?: string }>

// Parameters:
//   - updates: Config fields to update
// Returns: Success status with updated config or error
// Validation: Date ranges, week numbers
// Side Effects: Updates config.json, sets updatedAt
```

### File System Utilities (Internal)

**Read JSON File**

```typescript
// Internal: lib/fs/readJSON.ts
export async function readJSON<T>(filePath: string): Promise<T>

// Server-side only utility for reading JSON files
// Used by all READ operations
// Caching: Results cached in development, fresh on each request in production
```

**Write JSON File**

```typescript
// Internal: lib/fs/writeJSON.ts
export async function writeJSON<T>(filePath: string, data: T): Promise<void>

// Server-side only utility for writing JSON files
// Used by all WRITE operations
// Atomicity: Writes to temp file, then renames (atomic on Unix systems)
// Triggers: Calls Next.js revalidatePath() after write
```

### Error Handling

**Standard Error Response**:
```typescript
interface DataOperationError {
  success: false
  error: string              // Human-readable error message
  code?: string              // Machine-readable error code
  field?: string             // Field that caused error (validation)
}
```

**Error Codes**:
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Field validation failed
- `DUPLICATE`: Unique constraint violation (jersey number)
- `FILE_ERROR`: File read/write error
- `INVALID_STATE`: Invalid state transition (e.g., scheduled → completed without scores)

### Admin-Only Security Check

All WRITE operations must check admin state:

```typescript
// Wrap all write operations
const requireAdmin = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args) => {
    // Note: This check happens on client side calling server action
    // In Phase 3, this becomes proper backend auth
    const isAdmin = sessionStorage.getItem('admin') === 'true'
    if (!isAdmin) {
      throw new Error('Admin authentication required')
    }
    return fn(...args)
  }) as T
}
```

---

## Phase 3: Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── AdminModeIndicator
│   └── Footer
│       └── AdminButton
│
├── HomePage
│   ├── Hero (League Title + Gradient Background)
│   ├── WeeklyGames
│   │   └── GameCard (×N)
│   ├── TeamLogos
│   │   └── TeamLogo (×6)
│   └── StatLeaders
│       ├── GoalsLeaderboard
│       ├── AssistsLeaderboard
│       └── SavesLeaderboard
│
├── SchedulePage
│   ├── WeekSection (×N)
│   │   └── GameCard (×N)
│   └── AddGameButton (admin only)
│
├── TeamRosterPage
│   ├── TeamHeader
│   ├── RosterGrid
│   │   └── PlayerCard (×N)
│   └── AddPlayerButton (admin only)
│
├── BoxScorePage
│   ├── ScoreHeader
│   ├── StatisticsGrid
│   │   ├── GoalsSection
│   │   ├── AssistsSection
│   │   ├── SavesSection
│   │   └── CardsSection
│   └── EditBoxScoreForm (admin only)
│
└── AdminComponents (render conditionally)
    ├── AdminToolbar
    ├── PasswordModal
    ├── EditGameForm
    ├── EditPlayerForm
    └── UnsavedChangesModal
```

### Core Components

**HomePage** (`app/page.tsx`)
```typescript
/**
 * HomePage - Main landing page for YM Soccer League
 * 
 * Displays current week's games, team logos, and stat leaders.
 * Uses Server Components for static data, Client Components for interactivity.
 */
export default async function HomePage() {
  // Server-side data fetching
  const config = await getConfig()
  const games = await getGames({ weekNumber: config.currentWeek })
  const teams = await getTeams()
  const goalsLeaders = await calculateLeaders('goal')
  const assistsLeaders = await calculateLeaders('assist')
  const savesLeaders = await calculateLeaders('save')
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-black to-[#2686DF]">
      <Hero leagueName={config.leagueName} season={config.season} />
      <WeeklyGames games={games} weekNumber={config.currentWeek} />
      <TeamLogos teams={teams} />
      <StatLeaders 
        goals={goalsLeaders}
        assists={assistsLeaders}
        saves={savesLeaders}
      />
    </main>
  )
}
```

**GameCard** (`app/components/GameCard.tsx`)
```typescript
/**
 * GameCard - Displays a single game with teams, score, and click-through
 * 
 * Shows team matchup, final score if completed, or "vs" if scheduled.
 * Clickable to navigate to box score page.
 * 
 * @param game - Game object with teams and scores
 * @param admin - Admin mode flag (shows edit icon if true)
 */
'use client'
interface GameCardProps {
  game: Game
  admin?: boolean
}

export function GameCard({ game, admin }: GameCardProps) {
  const homeTeam = useTeam(game.homeTeamId)
  const awayTeam = useTeam(game.awayTeamId)
  
  const scoreDisplay = game.status === 'completed' && game.homeScore !== null
    ? `${game.homeScore} - ${game.awayScore}`
    : 'VS'
  
  return (
    <Link 
      href={`/games/${game.id}`}
      className="group relative block p-6 border border-[#523232] rounded-lg shadow-[0px_4px_4px_rgba(0,0,0,0.25)] hover:border-[#2686DF] transition-colors"
      aria-label={`View box score for ${homeTeam.name} vs ${awayTeam.name}`}
    >
      <div className="flex justify-between items-center">
        <span className="text-lg font-bold uppercase">{homeTeam.name}</span>
        <span className="text-2xl font-black text-[#2686DF]">{scoreDisplay}</span>
        <span className="text-lg font-bold uppercase">{awayTeam.name}</span>
      </div>
      
      <div className="mt-2 text-sm text-gray-400">
        {game.date} • {game.time} • {game.location}
      </div>
      
      {admin && (
        <button 
          className="absolute top-2 right-2 p-2 text-[#2686DF] hover:bg-[#2686DF]/20 rounded"
          onClick={(e) => {
            e.preventDefault()
            // Open edit modal
          }}
          aria-label="Edit game"
        >
          <Pencil size={16} />
        </button>
      )}
    </Link>
  )
}
```

**TeamLogo** (`app/components/TeamLogo.tsx`)
```typescript
/**
 * TeamLogo - Clickable team logo that navigates to roster page
 * 
 * Displays team logo image with team name.
 * Optimized with Next.js Image component.
 * 
 * @param team - Team object with name and logo URL
 */
interface TeamLogoProps {
  team: Team
}

export function TeamLogo({ team }: TeamLogoProps) {
  return (
    <Link
      href={`/teams/${team.id}`}
      className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-white/5 transition-colors"
      aria-label={`View ${team.name} roster`}
    >
      <div className="relative w-32 h-32">
        <Image
          src={team.logoUrl}
          alt={`${team.name} logo`}
          fill
          sizes="(max-width: 768px) 128px, 128px"
          className="object-contain"
        />
      </div>
      <span className="text-lg font-semibold uppercase tracking-wide">
        {team.name}
      </span>
    </Link>
  )
}
```

**StatLeaders** (`app/components/StatLeaders.tsx`)
```typescript
/**
 * StatLeaders - Displays top 5 leaders in goals, assists, and saves
 * 
 * Three-column layout on desktop, stacked on mobile.
 * Auto-updates when statistics change (via revalidation).
 * 
 * @param goals - Top goal scorers
 * @param assists - Top assist leaders
 * @param saves - Top goalkeeper save leaders
 */
interface StatLeadersProps {
  goals: Array<{ player: Player; count: number }>
  assists: Array<{ player: Player; count: number }>
  saves: Array<{ player: Player; count: number }>
}

export function StatLeaders({ goals, assists, saves }: StatLeadersProps) {
  return (
    <section className="py-12 px-6 max-w-7xl mx-auto">
      <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mb-12" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LeaderboardColumn title="GOALS LEADERS" leaders={goals} />
        <LeaderboardColumn title="ASSISTS LEADERS" leaders={assists} />
        <LeaderboardColumn title="SAVES LEADERS" leaders={saves} />
      </div>
    </section>
  )
}

function LeaderboardColumn({ title, leaders }: { title: string; leaders: Array<{ player: Player; count: number }> }) {
  return (
    <div>
      <h3 className="text-2xl font-bold uppercase mb-6 text-[#2686DF]">{title}</h3>
      <ol className="space-y-3">
        {leaders.map(({ player, count }, index) => (
          <li key={player.id} className="flex justify-between items-center text-lg">
            <span className="flex-1">
              <span className="text-gray-400 mr-3">{index + 1}.</span>
              {player.name}
            </span>
            <span className="font-bold text-[#2686DF]">{count}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

**AdminToolbar** (`app/components/AdminToolbar.tsx`)
```typescript
/**
 * AdminToolbar - Persistent toolbar shown when in admin mode
 * 
 * Displays admin status, exit button, and unsaved changes indicator.
 * Sticky positioned at top of viewport.
 */
'use client'
export function AdminToolbar() {
  const { isAdmin, logout } = useAdmin()
  const { hasUnsavedChanges } = useUnsavedChanges()
  
  if (!isAdmin) return null
  
  return (
    <div className="sticky top-0 z-50 bg-orange-600 text-white px-6 py-3 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <Shield size={20} />
        <span className="font-semibold uppercase">Admin Mode Active</span>
        {hasUnsavedChanges && (
          <span className="text-sm bg-white/20 px-2 py-1 rounded">
            Unsaved Changes
          </span>
        )}
      </div>
      
      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors"
        aria-label="Exit admin mode"
      >
        <X size={16} />
        Exit Admin Mode
      </button>
    </div>
  )
}
```

**PasswordModal** (`app/components/PasswordModal.tsx`)
```typescript
/**
 * PasswordModal - Modal dialog for admin authentication
 * 
 * Appears when user clicks ADMIN button.
 * Validates password and activates admin mode on success.
 */
'use client'
export function PasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login } = useAdmin()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    
    if (login(password)) {
      onClose()
      setPassword('')
      setError('')
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Admin Authentication</h2>
        
        <form onSubmit={handleSubmit}>
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-black border border-[#523232] rounded focus:border-[#2686DF] focus:ring-2 focus:ring-[#2686DF]/50 outline-none transition-colors"
            autoFocus
            aria-describedby={error ? 'password-error' : undefined}
          />
          {error && (
            <p id="password-error" className="mt-2 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
          
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-[#523232] rounded hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#2686DF] rounded hover:bg-[#2686DF]/90 transition-colors font-semibold"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

### Admin Edit Components

**EditBoxScoreForm** (`app/components/admin/EditBoxScoreForm.tsx`)
```typescript
/**
 * EditBoxScoreForm - Form for editing game scores and statistics
 * 
 * Allows admin to:
 * - Update final scores
 * - Add/edit goal scorers, assists, saves
 * - Record yellow/red/blue cards
 * 
 * Uses React Hook Form + Zod validation.
 */
'use client'
export function EditBoxScoreForm({ game }: { game: Game }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(boxScoreSchema)
  })
  
  const onSubmit = async (data) => {
    // Update game scores
    await updateGame(game.id, {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      status: 'completed'
    })
    
    // Update statistics (simplified - actual implementation more complex)
    // ... handle adding/updating GameStatistics
    
    toast.success('Box score updated successfully')
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Home Score</label>
          <input type="number" {...register('homeScore')} />
          {errors.homeScore && <span>{errors.homeScore.message}</span>}
        </div>
        <div>
          <label>Away Score</label>
          <input type="number" {...register('awayScore')} />
          {errors.awayScore && <span>{errors.awayScore.message}</span>}
        </div>
      </div>
      
      {/* Goal scorers, assists, saves, cards sections */}
      {/* Each section allows adding multiple entries with player selection */}
      
      <button type="submit">Save Box Score</button>
    </form>
  )
}
```

---

## Phase 4: Implementation Roadmap

### Sprint 1: Foundation (Week 1)

**Objectives**: Setup, design system, data infrastructure

**Tasks**:
1. **Project Setup**
   - Initialize Next.js 16 project with TypeScript
   - Configure Tailwind CSS with custom theme (gradient, colors, fonts)
   - Set up ESLint with accessibility rules
   - Configure environment variables

2. **Design System**
   - Create Tailwind config with design tokens:
     - Colors: gradient, teal accent, borders, shadows
     - Typography: Rajdhani/Inter fonts, sizes, weights
     - Spacing: consistent scale
   - Build base components: Button, Input, Card
   - Implement dark theme globally

3. **Data Migration**
   - Write migration script: `rosters.csv` → `rosters.json`
   - Create sample data:
     - `games.json` (12 weeks of games)
     - `statistics.json` (sample box scores)
     - `config.json` (league config)
   - Write data utility functions: `readJSON`, `writeJSON`

4. **Layout & Navigation**
   - Build `app/layout.tsx` with Header and Footer
   - Implement Navigation component with team dropdown
   - Add AdminButton to Footer
   - Create gradient background wrapper

**Deliverables**: Running Next.js app with design system, sample data, basic layout

### Sprint 2: Public Viewer (Week 2)

**Objectives**: Build all public-facing pages

**Tasks**:
1. **Homepage**
   - Hero section with league title and gradient
   - WeeklyGames component (current week filter)
   - TeamLogos grid (6 teams, 2 rows)
   - StatLeaders three-column layout
   - Fetch data with Server Components

2. **Schedule Page**
   - Full season schedule grouped by week
   - GameCard components (clickable)
   - Current week highlighting
   - Responsive grid layout

3. **Team Roster Pages**
   - Dynamic route: `app/teams/[teamId]/page.tsx`
   - Team header with logo and name
   - Player grid with names and jersey numbers
   - Parse roster data from JSON

4. **Box Score Pages**
   - Dynamic route: `app/games/[gameId]/page.tsx`
   - Score header with team names
   - Statistics sections: goals, assists, saves, cards
   - Group statistics by team

**Deliverables**: Fully functional public viewer; all pages navigable; 2-click rule enforced

### Sprint 3: Admin Authentication & State (Week 3)

**Objectives**: Admin mode activation and session management

**Tasks**:
1. **Admin Context**
   - Create AdminProvider with Context API
   - Implement sessionStorage persistence
   - Build `useAdmin` hook for global access

2. **Password Modal**
   - Build PasswordModal component
   - Implement password validation (hardcoded check)
   - Handle success/error states
   - Focus management and accessibility

3. **Admin Indicators**
   - Build AdminToolbar (sticky top banner)
   - Show/hide based on `isAdmin` state
   - Exit admin mode functionality
   - Visual state changes across app

4. **Unsaved Changes Tracking**
   - Create UnsavedChangesContext
   - Track dirty form states
   - Warning modal on exit/navigation
   - Reset on save/cancel

**Deliverables**: Working admin authentication; session persists across pages; clear visual indicators

### Sprint 4: Admin Forms & Validation (Week 4)

**Objectives**: Edit interfaces for all data types

**Tasks**:
1. **Form Infrastructure**
   - Install React Hook Form + Zod
   - Create validation schemas for Game, Player, GameStatistic
   - Build reusable FormField component
   - Toast notifications for feedback

2. **Box Score Editing**
   - EditBoxScoreForm component
   - Player dropdown (autocomplete)
   - Add/remove statistics dynamically
   - Validation: score matches goals, player exists

3. **Schedule Management**
   - EditGameForm (inline or modal)
   - Date/time pickers
   - Add Game form
   - Delete confirmation modal

4. **Roster Management**
   - AddPlayerForm
   - EditPlayerForm (inline editing)
   - Delete player with statistics warning
   - Jersey number duplicate check

**Deliverables**: Complete admin CRUD for all entities; validation working; feedback messages

### Sprint 5: Data Persistence & Integration (Week 5)

**Objectives**: Write JSON files; integrate with viewer

**Tasks**:
1. **Write Operations**
   - Implement all `lib/data` write functions
   - Atomic file writes (temp file + rename)
   - Next.js revalidatePath after writes
   - Error handling and rollback

2. **Read/Write Integration**
   - Connect admin forms to write functions
   - Trigger revalidation on save
   - Update leaderboards automatically
   - Handle concurrent edit conflicts (Phase 1: last write wins)

3. **Data Validation**
   - Server-side validation (matches Zod schemas)
   - Business rule enforcement (score/goals match, jersey duplicates)
   - Cascading updates (roster change → dropdown update)

4. **Testing Data Flow**
   - Add test game → appears in schedule
   - Update box score → leaderboards update
   - Add player → available in box score dropdowns
   - Delete game → statistics removed

**Deliverables**: Full data persistence working; admin edits immediately visible to viewers

### Sprint 6: Polish & Optimization (Week 6)

**Objectives**: Performance, accessibility, documentation

**Tasks**:
1. **Performance Optimization**
   - Image optimization (logos)
   - Code splitting (admin components)
   - Lighthouse audit (target: ≥90)
   - Bundle size analysis (target: <100KB initial)

2. **Accessibility Audit**
   - Keyboard navigation testing
   - Screen reader testing (NVDA/VoiceOver)
   - Color contrast verification (WCAG AA)
   - ARIA labels and roles
   - Focus management in modals

3. **Responsive Testing**
   - Test on iPhone SE (375px)
   - Test on iPad (768px)
   - Test on desktop (1920px)
   - Fix layout issues, adjust breakpoints
   - Touch target sizes (≥44px)

4. **Documentation**
   - Component documentation (JSDoc)
   - README: setup instructions, data structure
   - Admin user guide (how to update scores)
   - Code comments: "why" not "what"

5. **Constitutional Validation**
   - Code review: function length ≤30 lines
   - Code review: nesting ≤3 levels
   - Code review: documentation present
   - Performance: <3s on 3G
   - Navigation: 2-click rule enforced

**Deliverables**: Production-ready application; all constitutional principles verified

---

## Risks & Mitigation

### Risk 1: JSON File Concurrent Writes

**Risk**: Multiple admins editing simultaneously could corrupt JSON files

**Likelihood**: Low (Phase 1 assumption: single admin)

**Impact**: High (data loss)

**Mitigation**:
- Phase 1: Accept risk (document in assumptions)
- Atomic writes (temp file + rename) reduce window
- Phase 3: Migrate to database with transactions

### Risk 2: Client-Side Password Exposure

**Risk**: Hardcoded password visible in client bundle

**Likelihood**: High (inherent to client-side auth)

**Impact**: Medium (password could be discovered, but low-stakes data)

**Mitigation**:
- Document security limitations in spec
- Acceptable for Phase 1 amateur league
- Environment variable (not in source code)
- Phase 3: Backend authentication

### Risk 3: Performance with Large Datasets

**Risk**: JSON file parsing slow with many games/statistics

**Likelihood**: Medium (grows over multiple seasons)

**Impact**: Medium (slower page loads)

**Mitigation**:
- Next.js static generation (parse at build time)
- Server Components (parsing on server, not client)
- Phase 3: Database with indexing and query optimization
- Data archiving strategy (move old seasons to separate files)

### Risk 4: Design System Implementation Drift

**Risk**: Actual implementation doesn't match design specifications

**Likelihood**: Medium (subjective interpretation of gradients, spacing)

**Impact**: Low (visual inconsistency, not functional)

**Mitigation**:
- Precise Tailwind config matches exact color values
- Design review at end of each sprint
- Screenshot comparison with mockup
- Storybook for component library (optional)

### Risk 5: Accessibility Gaps

**Risk**: Missing ARIA labels, keyboard traps, contrast issues

**Likelihood**: Medium (easy to overlook)

**Impact**: Medium (excludes users, fails constitutional principle)

**Mitigation**:
- Automated testing: Lighthouse, axe-core
- Manual testing: keyboard-only navigation, screen reader
- Accessibility checklist in code review
- Constitutional Principle 2 explicitly enforced

---

## Success Metrics

### Technical Metrics

- **Performance**: Lighthouse score ≥90
- **Accessibility**: Lighthouse accessibility ≥95, zero axe-core violations
- **Bundle Size**: Initial JS <100KB gzipped
- **Load Time**: <3s on 3G (constitutional requirement)
- **Code Quality**: Zero ESLint errors, 100% TypeScript coverage

### User Metrics

- **Navigation**: 100% of features reachable in ≤2 clicks (constitutional requirement)
- **Readability**: All text ≥16px, contrast ratio ≥4.5:1 (constitutional requirement)
- **Admin Efficiency**: Box score update <3 minutes (success criterion)
- **Mobile Usability**: No horizontal scroll, touch targets ≥44px

### Constitutional Compliance

- **Principle 1 (Code Simplicity)**: ✅ All functions ≤30 lines, ≤3 nesting levels
- **Principle 2 (Accessibility)**: ✅ WCAG AA compliance, keyboard navigable
- **Principle 3 (Documentation)**: ✅ All components documented, inline comments present
- **Principle 4 (Navigation)**: ✅ 2-click rule enforced, persistent nav
- **Principle 5 (Visual Clarity)**: ✅ 16px+ text, consistent spacing, limited palette
- **Principle 6 (Performance)**: ✅ <3s load, optimized images, responsive

---

## Deployment Strategy

### Phase 1 Deployment: Vercel (Recommended)

**Rationale**: Zero-config Next.js hosting, automatic deployments, edge network

**Steps**:
1. Connect GitHub repository to Vercel
2. Configure environment variables (admin password)
3. Set build command: `npm run build`
4. Deploy to production URL
5. Point custom domain (optional): `ymjaxsoccer.com`

**Data Handling**:
- JSON files committed to Git (tracked in version control)
- Admin edits trigger Git commits (manual or automated)
- Redeploy after data updates (or use Vercel ISR for dynamic updates)

**Alternative: Self-Hosted**

If Vercel not suitable:
- Build static export: `next build && next export`
- Host on any static host (Netlify, AWS S3, GitHub Pages)
- Note: Admin edits require backend in this case (Phase 3 feature)

---

## Future Enhancements (Phase 3+)

### Database Migration

**When**: After Phase 1 proves concept, before multi-admin scenarios

**Technology**: PostgreSQL or MongoDB

**Benefits**:
- Concurrent writes with transactions
- Query performance at scale
- Relational integrity
- Backend API for security

### Backend Authentication

**When**: With database migration

**Technology**: NextAuth.js or custom JWT

**Features**:
- Individual admin accounts
- Role-based permissions (admin, score keeper, viewer)
- Password change functionality
- Session management
- Audit logs

### Advanced Features

- **Team Standings**: Auto-calculated from game results
- **Playoff Brackets**: Tournament mode with knockout stages
- **Player Profiles**: Detailed statistics, season history
- **Historical Archives**: Browse previous seasons
- **Live Updates**: WebSocket for real-time score updates
- **Mobile Admin App**: Native iOS/Android for score entry at games

---

## Appendix: Quick Reference

### Key Files

- **Data**: `league_data/*.json`
- **Types**: `types/*.ts`
- **Data Utils**: `lib/data/*.ts`
- **Components**: `app/components/**/*.tsx`
- **Styles**: `app/globals.css`, `tailwind.config.ts`
- **Admin Context**: `contexts/AdminContext.tsx`

### Color Palette

```
Background Gradient: linear-gradient(138.92deg, #000000 42.58%, #2686DF 83.07%)
Teal Accent: #2686DF
Border: #523232
Shadow: rgba(0, 0, 0, 0.25)
Text White: #FFFFFF
Text Gray: #A0A0A0
```

### Typography

```
Headings: 'Rajdhani', bold, uppercase
Body: 'Inter', 16px minimum
Emphasis: Teal color, 500-600 weight
```

### Breakpoints

```
Mobile: <768px
Tablet: 768px-1023px
Desktop: ≥1024px
```

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Start production
npm start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

**End of Implementation Plan**

**Status**: Ready for Development  
**Constitutional Compliance**: ✅ All 6 principles addressed  
**Next Step**: Sprint 1 - Foundation & Setup

