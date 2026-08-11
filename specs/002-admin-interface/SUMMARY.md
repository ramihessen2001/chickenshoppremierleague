# Specification Summary: Admin Interface for League Data Management

**Feature Number**: 002  
**Feature Name**: Admin Interface  
**Branch**: `002-admin-interface`  
**Status**: ✅ COMPLETE - Ready for Planning  
**Created**: 2025-12-20  
**Depends On**: Feature 001 (League Viewer)

---

## Quick Overview

Extends the public league viewer with password-protected administrative capabilities that allow trusted league administrators to update scores, manage schedules, edit rosters, and maintain game statistics. Admin mode integrates seamlessly with the existing viewer interface.

---

## Key Features

### 🔐 Authentication
- **ADMIN button** at bottom of every page (always visible)
- **Password prompt** when clicked
- **Password**: `sport2233` (hardcoded for Phase 1)
- **Admin mode indicators** when authenticated (banner, edit controls appear)
- **Exit admin mode** button to return to viewer

### 📊 Box Score Editing
- Edit final scores for completed games
- Add/edit **goal scorers** (multiple goals per player)
- Add/edit **assists** (multiple per player)
- Enter **goalkeeper saves**
- Record **yellow cards, red cards, blue cards**
- **Data validation**: score matches goal count
- **Immediate visibility**: changes appear instantly to public viewers

### 📅 Schedule Management
- **Edit existing games**: change date, time, location, status
- **Add new games**: create matchups for any week
- **Delete games**: remove with confirmation (warns if box score exists)
- **Game status**: Scheduled, In Progress, Completed, Cancelled, Postponed
- **Conflict warnings**: alerts if same field/time but allows override

### 👥 Roster Management
- **Add players**: name and jersey number
- **Edit players**: modify name or number
- **Remove players**: delete with confirmation (warns if has statistics)
- **Validation**: prevents duplicate jersey numbers on same team
- **Immediate sync**: updated rosters available in box score editing

### 🏆 Automatic Leaderboards
- **Auto-calculates** top 5 leaders when box scores are saved
- **Goals, Assists, Saves** leaderboards update automatically
- **No manual editing** (ensures data consistency)
- **Handles ties**: shows all tied players (may exceed 5)

### 💾 Session Management
- **Persistent across pages**: admin mode maintained while navigating
- **Unsaved changes warnings**: alerts before losing edits
- **Exit safely**: explicit logout with change checks
- **Session timeout**: 30 minutes inactivity (optional Phase 1)

---

## Admin Workflow

### Typical Game Day Flow

1. **Authenticate**
   - Click ADMIN button → Enter password `sport2233` → Admin mode activates

2. **Update Scores**
   - Navigate to game → Click edit → Enter final score
   - Add goal scorers, assists, saves, cards → Save
   - Box score and leaderboards update instantly

3. **Prepare Next Week**
   - Go to Full Schedule → Find next week's games
   - Edit dates, times, locations → Save
   - Public viewers see updated schedule immediately

4. **Manage Rosters**
   - If new player joins → Navigate to team roster
   - Click Add Player → Enter name and number → Save
   - Player available for stats in next game

5. **Exit**
   - Click Exit Admin Mode → Return to public viewer

---

## Security Model (Phase 1)

### Current Approach
- ✅ Single shared password (`sport2233`)
- ✅ Client-side validation only (no backend)
- ✅ No user accounts or permission levels
- ✅ Unlimited login attempts
- ✅ Session-based (ends on browser close or explicit logout)

### Why This Is Acceptable
- Amateur league with **trusted administrators**
- Low-stakes data (game scores, not financial/personal info)
- Small user group (2-3 admins total)
- Physical security (admins work together at league events)
- Rapid deployment without backend infrastructure

### Future Enhancements (Phase 3+)
- Backend authentication with hashed passwords
- Individual admin accounts
- Role-based permissions (score keeper, roster manager, super admin)
- Audit logs (who changed what, when)
- Password change functionality
- Session timeout enforcement
- Rate limiting on login attempts

---

## Data Persistence Strategy

### Recommended: JSON Files (Option B)

**Structure:**
```
league_data/
├── rosters.json          # Team rosters
├── games.json            # Game schedules
├── statistics.json       # Box score statistics
└── images/               # Team logos (unchanged)
```

**Advantages:**
- Structured data for complex relationships
- Easy parsing in JavaScript/TypeScript
- Better than CSV for nested data (box scores, statistics)
- Future-proof for database migration (Phase 3)
- Can export/import for backups

**Alternative Options:**
- **Option A (CSV)**: Simple but poor for relational data
- **Option C (localStorage)**: Fast but not shared across devices

---

## Integration with Feature 001

### Builds On Viewer
- All public viewer pages remain functional
- Admin features are **additive**, not breaking changes
- Edit controls **overlay** on existing views
- Public viewers unaffected by admin mode

### Component Extensions
- **Homepage**: Add edit icons to game listings
- **Box Score**: Add edit form for statistics entry
- **Schedule Page**: Add edit/add/delete controls per game
- **Roster Page**: Add add/edit/remove player controls
- **Global**: Add ADMIN button footer, admin mode banner

---

## User Scenarios Covered

1. ✅ **Administrator entering admin mode** (James)
2. ✅ **Updating game score and statistics** (James)
3. ✅ **Managing weekly game schedule** (James)
4. ✅ **Updating team roster** (James adds new player)
5. ✅ **Exiting admin mode** (James returns to viewer)

All scenarios include comprehensive edge cases (errors, validation, confirmations).

---

## Success Metrics

- 🎯 Authenticate within **5 seconds**
- 🎯 Security: **Incorrect password rejected** with clear error
- 🎯 Admin indicators visible within **1 second**
- 🎯 Update box score within **3 minutes** (full game stats)
- 🎯 Update schedule within **2 minutes** (add or edit game)
- 🎯 Update roster within **1 minute** (add player)
- 🎯 Changes **immediately visible** to public (no refresh)
- 🎯 **Data validation** catches errors with helpful messages
- 🎯 **Unsaved changes** warnings before navigation/exit
- 🎯 **Exit admin mode** within 2 clicks
- 🎯 **Constitutional compliance** maintained (all 6 principles)

---

## Constitutional Alignment

✅ **Code Simplicity**: Admin features as simple toggle states and form validation  
✅ **Accessibility First**: Keyboard accessible, labeled forms, screen reader support  
✅ **Documentation Excellence**: Clear labels, actionable errors, helpful messages  
✅ **User-Centric Navigation**: Admin button always accessible, contextual edits  
✅ **Visual Clarity**: Prominent indicators, clear icons, color-coded feedback  
✅ **Performance & Responsiveness**: Desktop-optimized, quick saves, no viewer impact

---

## Technical Requirements

### State Management
- **Admin session state**: authenticated boolean, global access
- **Unsaved changes tracker**: which sections have edits
- **Edit mode state**: per-component form values and validation

### Form Components Needed
- Text inputs (player names, locations)
- Numeric inputs (scores, jersey numbers, save counts)
- Dropdowns (player selection, team selection, status selection)
- Date picker (game dates)
- Time picker (game times)
- Autocomplete (player search in rosters)

### Validation Requirements
- Required field checks
- Numeric range validation (scores, jersey numbers)
- Duplicate detection (jersey numbers per team)
- Data consistency (score vs goal count)
- Date/time format validation

---

## Edge Cases Handled

### Authentication
- ❌ Incorrect password → Error message, allow retry
- ❌ Empty password → Disable submit or show validation
- ✅ Correct password → Activate mode, show indicators

### Box Score Editing
- ⚠️ Score mismatch with goals → Warning (allow save with override)
- ❌ Player not in roster → Autocomplete suggests existing players
- ⚠️ Unsaved changes → Warn on navigation
- ✅ Valid data → Save and show success message

### Schedule Management
- ⚠️ Conflicting times → Warning but allow override
- ⚠️ Past dates → Warning but allow (reschedules happen)
- ❌ Same team vs itself → Prevent with error
- ✅ Valid game → Save and update display

### Roster Management
- ❌ Duplicate jersey number → Error with existing player name
- ⚠️ Delete player with stats → Strong warning, allow with confirm
- ❌ Empty name/number → Prevent save, highlight fields
- ✅ Valid player → Add to roster and sync to dropdowns

---

## Out of Scope (Phase 2+)

- ❌ Multi-user admin accounts
- ❌ Permission system (roles/access levels)
- ❌ Audit trail and change history
- ❌ Bulk data import/export
- ❌ Advanced statistics and analytics
- ❌ Team standings calculations
- ❌ Playoff bracket management
- ❌ Email notifications
- ❌ Mobile-optimized admin interface

---

## Dependencies

### Required
- ✅ Feature 001 (League Viewer) - completed
- 🔄 Form handling/validation library
- 🔄 Data persistence mechanism (JSON file handling)
- 🔄 Session state management (Context/Zustand)

### Optional
- 🔄 Date picker component
- 🔄 Time picker component
- 🔄 Autocomplete component
- 🔄 Toast notification component

---

## Files

- **Spec**: `specs/002-admin-interface/spec.md`
- **Checklist**: `specs/002-admin-interface/checklists/requirements.md`
- **Summary**: `specs/002-admin-interface/SUMMARY.md` (this file)
- **Branch**: `002-admin-interface`

---

## Next Steps

1. ✅ Specification complete and validated
2. 🔄 **Create technical implementation plan**
3. ⏳ Determine data persistence approach (recommend JSON)
4. ⏳ Design admin UI components (edit buttons, forms, modals)
5. ⏳ Implement authentication and session management
6. ⏳ Build edit interfaces for box scores, schedules, rosters
7. ⏳ Test admin workflows end-to-end
8. ⏳ Verify public viewer unaffected
9. ⏳ Deploy Phase 1

---

**Ready for Planning**: Yes ✅  
**Constitutional Compliance**: Yes ✅  
**Admin Needs Addressed**: Yes ✅  
**Security Model Documented**: Yes ✅  
**Integration Strategy Clear**: Yes ✅

**Status**: Proceed to technical planning phase.

