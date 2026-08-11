# Quick Start Guide: YM Soccer League Application

**Last Updated**: 2025-12-20  
**For**: Developers, Contributors, League Administrators

---

## Getting Started in 5 Minutes

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Any recent version
- **Code Editor**: VS Code recommended (with ESLint extension)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ym_soccer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
ym_soccer/
├── app/                      # Next.js App Router pages
│   ├── page.tsx              # Homepage
│   ├── layout.tsx            # Root layout (Header/Footer)
│   ├── schedule/             # Full season schedule page
│   ├── teams/[teamId]/       # Team roster pages (dynamic)
│   ├── games/[gameId]/       # Box score pages (dynamic)
│   └── components/           # React components
├── league_data/              # Data files (JSON + images)
│   ├── rosters.json          # Team rosters
│   ├── games.json            # Game schedules
│   ├── statistics.json       # Box score statistics
│   ├── config.json           # League configuration
│   └── images/               # Team logos
├── lib/                      # Utility functions
│   ├── data/                 # Data access functions
│   └── fs/                   # File system utilities
├── types/                    # TypeScript type definitions
├── contexts/                 # React Context providers
└── specs/                    # Feature specifications
```

---

## Key Concepts

### Dual-Mode Architecture

The application has two modes:

1. **Viewer Mode** (Public): Anyone can view league data
2. **Admin Mode** (Protected): Authorized users can edit data

**Admin Password**: `sport2233`

### Data Flow

```
JSON Files → Data Functions → Server Components → UI
              ↑                                    ↓
              └──────── Admin Forms ←──────────────┘
```

**Viewer Flow**:
- JSON files read by server
- Data parsed and passed to components
- Components render static pages

**Admin Flow**:
- User authenticates with password
- Admin mode activated (session state)
- Forms appear for editing
- On save, JSON files updated
- Pages revalidate automatically

---

## Common Tasks

### Viewing League Data (Public)

**Homepage** (`/`):
- Current week's games
- Team logos (click to view rosters)
- Top 5 stat leaders (goals, assists, saves)

**Full Schedule** (`/schedule`):
- All games for entire season
- Grouped by week
- Click game to see box score

**Team Rosters** (`/teams/[teamId]`):
- All players with jersey numbers
- Parsed from `league_data/rosters.json`

**Box Scores** (`/games/[gameId]`):
- Final score
- Goals, assists, saves
- Yellow/red/blue cards

### Editing Data (Admin)

**1. Enter Admin Mode**:
- Scroll to bottom of any page
- Click "ADMIN" button
- Enter password: `sport2233`
- Admin toolbar appears at top

**2. Update Box Score**:
- Navigate to game
- Click "Edit" icon
- Enter final scores
- Add goal scorers, assists, saves, cards
- Click "Save"
- Box score and leaderboards update automatically

**3. Manage Schedule**:
- Go to full schedule page
- Click "Edit" on game or "Add Game"
- Update date, time, location, status
- Click "Save"

**4. Manage Rosters**:
- Go to team roster page
- Click "Add Player" or "Edit" on player
- Enter name and jersey number
- Click "Save"
- Player immediately available in box score dropdowns

**5. Exit Admin Mode**:
- Click "Exit Admin Mode" in toolbar
- Returns to viewer mode

---

## Design System

### Colors

```
Background: linear-gradient(138.92deg, #000000 42.58%, #2686DF 83.07%)
Accent: #2686DF (teal)
Borders: #523232 (dark brown)
Text: #FFFFFF (white), #A0A0A0 (gray)
```

### Typography

- **Headers**: Rajdhani, Bold, Uppercase
- **Body**: Inter, 16px minimum
- **Accent**: Teal color for highlights

### Spacing

- Padding: 24px (`p-6`)
- Section margins: 48px (`my-12`)
- Grid gaps: 24px (`gap-6`)

---

## Development Workflow

### Running Locally

```bash
# Development server (hot reload)
npm run dev

# Type checking
npx tsc --noEmit

# Lint code
npm run lint

# Build for production
npm run build
npm start
```

### Making Changes

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes** (follow constitutional principles)

3. **Test locally**:
   - Viewer mode: all pages load
   - Admin mode: authentication works
   - Edit operations: data persists
   - Responsive: mobile/tablet/desktop

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: description of change"
   git push origin feature/my-feature
   ```

5. **Create pull request**

### Code Review Checklist

Before submitting PR, verify:

- [ ] Functions ≤30 lines
- [ ] Nesting ≤3 levels
- [ ] Components have JSDoc comments
- [ ] Inline comments explain "why"
- [ ] All interactive elements keyboard accessible
- [ ] Forms have labels
- [ ] ARIA labels on icon buttons
- [ ] Text minimum 16px
- [ ] Works on mobile without horizontal scroll
- [ ] No ESLint errors
- [ ] TypeScript types explicit

---

## Data Management

### Editing JSON Files Manually

If you need to bulk-edit data:

1. Open JSON file in editor
2. Make changes (maintain structure)
3. Validate JSON syntax (use jsonlint.com)
4. Save file
5. Restart dev server

### Adding a New Team

1. Add logo image to `league_data/images/`
2. Edit `league_data/rosters.json`:
   ```json
   {
     "teams": [
       {
         "id": "newteam",
         "name": "New Team",
         "logoUrl": "/league_data/images/newteam_logo.png",
         "roster": [],
         "createdAt": "2025-12-20T00:00:00Z",
         "updatedAt": "2025-12-20T00:00:00Z"
       }
     ]
   }
   ```
3. Restart server

### Creating Sample Games

Edit `league_data/games.json`:

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
      "homeScore": null,
      "awayScore": null,
      "status": "scheduled",
      "statistics": [],
      "createdAt": "2025-12-20T00:00:00Z",
      "updatedAt": "2025-12-20T00:00:00Z"
    }
  ]
}
```

---

## Troubleshooting

### Issue: Admin button doesn't appear

**Solution**: Check that Footer component is rendering. Admin button should always be visible.

### Issue: Password not working

**Solution**: 
- Verify password is exactly `sport2233` (case-sensitive)
- Check `.env.local` file exists with `NEXT_PUBLIC_ADMIN_PASSWORD=sport2233`
- Restart dev server after changing env file

### Issue: Changes not showing up

**Solution**:
- Check browser console for errors
- Verify JSON file syntax is valid
- Restart dev server
- Clear browser cache

### Issue: Images not loading

**Solution**:
- Verify image paths in JSON match actual file paths
- Check images are in `league_data/images/` directory
- Ensure image extensions are lowercase (`.png`, not `.PNG`)

### Issue: Page not found (404)

**Solution**:
- Verify dynamic routes exist: `app/teams/[teamId]/page.tsx`
- Check that team ID in URL matches team ID in JSON
- Ensure file naming conventions: `page.tsx`, not `Page.tsx`

---

## Performance Tips

### Optimizing Images

```bash
# Install image optimization tool
npm install -g sharp-cli

# Optimize all logos
sharp -i league_data/images/*.png -o league_data/images/ --resize 200,200 --format png
```

### Checking Bundle Size

```bash
npm run build
# Look for "First Load JS" in output
# Target: <100KB for homepage
```

### Lighthouse Audit

```bash
# Run in Chrome DevTools
# Open DevTools > Lighthouse > Generate Report
# Target: Performance ≥90, Accessibility ≥95
```

---

## Resources

### Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Project-Specific

- [Project Constitution](../.specify/memory/constitution.md)
- [Feature 001 Spec](./001-league-viewer/spec.md)
- [Feature 002 Spec](./002-admin-interface/spec.md)
- [Implementation Plan](./implementation-plan.md)

### Tools

- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [JSON Validator](https://jsonlint.com/)
- [TypeScript Playground](https://www.typescriptlang.org/play)

---

## Getting Help

### Common Questions

**Q: How do I add a new page?**  
A: Create new file in `app/` directory. Example: `app/stats/page.tsx` → `/stats` route

**Q: How do I add a new component?**  
A: Create new file in `app/components/`. Add JSDoc comment. Import where needed.

**Q: How do I change the league name?**  
A: Edit `league_data/config.json` → `leagueName` field

**Q: How do I reset admin password?**  
A: Edit `.env.local` → `NEXT_PUBLIC_ADMIN_PASSWORD=newpassword` → Restart server

### Support

- Check project specs in `/specs/` directory
- Review constitutional principles in `.specify/memory/constitution.md`
- Ask team members (league administrators)

---

**Quick Start Complete!**

You're now ready to develop or administer the YM Soccer League application.

**Next Steps**:
- Explore the codebase
- Read the implementation plan for technical details
- Review specifications for feature requirements
- Start coding! 🚀⚽

