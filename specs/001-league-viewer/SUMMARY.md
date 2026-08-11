# Specification Summary: 2025 YM Soccer Winter League Viewer

**Feature Number**: 001  
**Feature Name**: League Viewer  
**Branch**: `001-league-viewer`  
**Status**: ✅ COMPLETE - Ready for Planning  
**Created**: 2025-12-20

---

## Quick Overview

A public-facing web application for fans, players, and families to view league information including:
- Current week's games
- Full season schedule
- Team rosters (6 teams)
- Box scores with detailed statistics
- Top 5 statistical leaders

---

## Key Decisions Made

### Box Score Content (Q1)
✅ **Custom Answer**: Track and display six statistics:
- **Goals** - Player scored
- **Assists** - Player assisted on goal
- **Saves** - Goalkeeper prevented goal
- **Yellow Cards** - Player cautioned
- **Red Cards** - Player ejected
- **Blue Cards** - League-specific disciplinary card

### Data Source (Q2)
✅ **Option C**: Hardcoded sample data for Phase 1
- Allows immediate UI/UX development
- Real data source (admin interface, database) in Phase 2
- Sample data structure designed to be easily replaceable

### Week Navigation (Q3)
✅ **Option C**: Current week + full season schedule page
- Homepage shows current week's games
- Separate "Full Season Schedule" page shows all weeks
- Provides both focused (current) and comprehensive (season) views

---

## Pages & Routes

1. **Homepage**
   - League branding (logos, title)
   - Current week's games
   - Six team logos (clickable)
   - Top 5 leaders in Goals, Assists, Saves
   - Link to full season schedule

2. **Team Roster Pages** (6 pages)
   - Team name and logo
   - Complete player roster with jersey numbers
   - Parsed from `league_data/rosters.csv`

3. **Box Score Views**
   - Final score
   - Six statistics by player and team
   - Accessed by clicking games

4. **Full Season Schedule Page**
   - All weeks organized sequentially
   - All games with dates, times, locations
   - Current week highlighted
   - Game status (scheduled/completed)

---

## Teams (6)

1. **Eagles** - Y.M.J. shield with eagle
2. **Panthers** - Panther silhouette circular design
3. **Lions** - Lion with architectural elements
4. **Dolphins** - Dolphin wave design
5. **Knights** - Knight archer shield design
6. **Warriors** - Warrior helmet circular design

---

## Data Sources

### Existing
- `league_data/rosters.csv` - Player rosters with names and jersey numbers
- `league_data/images/*.png` - Team and league logos

### Phase 1 (Sample Data)
- Game schedules (hardcoded)
- Box score statistics (hardcoded)
- Player statistics for leaderboards (hardcoded)

### Phase 2 (Future)
- Dynamic data source (admin interface, database, or API)

---

## Constitutional Alignment

All six constitutional principles explicitly addressed:

✅ **Code Simplicity** - Clear component separation, single responsibilities  
✅ **Accessibility First** - Keyboard navigation, ARIA labels, WCAG AA contrast  
✅ **Documentation Excellence** - Comprehensive edge cases, data formats documented  
✅ **User-Centric Navigation** - 2-click rule enforced for all major features  
✅ **Visual Clarity** - 16px minimum font, clear hierarchy, consistent branding  
✅ **Performance & Responsiveness** - 3s load time, mobile-first responsive design

---

## Success Metrics

- 🎯 Users find their team's game in **< 5 seconds**
- 🎯 All features accessible in **≤ 2 clicks**
- 🎯 Homepage loads in **< 3 seconds on 3G**
- 🎯 Readable on mobile **without zooming** (16px+ text)
- 🎯 Roster data **95% accuracy** from CSV
- 🎯 Box scores show **all 6 statistics** clearly
- 🎯 Works on **mobile, tablet, desktop** without horizontal scroll

---

## User Scenarios Covered

1. ✅ Fan checking this week's games (Maria)
2. ✅ Player viewing game box score (Ahmed)
3. ✅ Fan exploring team rosters (Fatima)
4. ✅ Casual fan checking stat leaders (Omar)
5. ✅ Manager viewing full season schedule (Sarah)

---

## Out of Scope (Phase 2+)

- ❌ Administrative interface
- ❌ User authentication/login
- ❌ Historical season archives
- ❌ Detailed player profiles
- ❌ Live/real-time updates
- ❌ Social features
- ❌ Team standings/playoffs

---

## Special Notes

### Blue Card
League-specific disciplinary card (not standard soccer). Exact consequences to be documented in future admin specification.

### "WEEKS GAMES"
Grammatically unusual (missing apostrophe) but intentional to match mockup design.

### Sample Data Strategy
Hardcoded data in Phase 1 allows rapid UI development. Structure designed for easy replacement with dynamic source in Phase 2.

---

## Next Steps

1. ✅ Specification complete and validated
2. 🔄 **Create technical implementation plan** (`/speckit.plan`)
3. ⏳ Begin development (following constitutional principles)
4. ⏳ Test against success criteria
5. ⏳ Deploy Phase 1

---

## Files

- **Spec**: `specs/001-league-viewer/spec.md`
- **Checklist**: `specs/001-league-viewer/checklists/requirements.md`
- **Summary**: `specs/001-league-viewer/SUMMARY.md` (this file)
- **Branch**: `001-league-viewer`

---

**Ready for Planning**: Yes ✅  
**Constitutional Compliance**: Yes ✅  
**User Needs Addressed**: Yes ✅  
**Scope Well-Defined**: Yes ✅

**Status**: Proceed to technical planning phase.

