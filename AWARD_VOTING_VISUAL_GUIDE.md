# Award Voting System - Visual Guide

This guide shows what users and admins will see when using the award voting system.

## 📍 Location

**URL**: `https://ymsoccer.vercel.app/stats`

The award voting section appears at the **top** of the stats page, above the player statistics table.

## 👥 User View (Public)

### Initial State - No Active Awards
```
┌─────────────────────────────────────────────────────┐
│  🏆                                                  │
│                                                      │
│  No active awards at this time                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Active Awards Available
```
┌─────────────────────────────────────────────────────┐
│  Award Voting                                        │
│  Vote for your favorite players in each category    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🏆 Most Valuable Player                             │
│  Best overall player of the season                   │
│  12 votes cast                                       │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #10  John Smith                              │  │
│  │       🔵 Blue Team                         ○  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #7   Mike Johnson                            │  │
│  │       🔴 Red Team                          ✓  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #15  Sarah Williams                          │  │
│  │       🟢 Green Team                        ○  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  [ Submit Vote ]                                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🏆 Golden Boot                                      │
│  Top goal scorer of the season                       │
│  8 votes cast                                        │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #9   Alex Martinez                           │  │
│  │       ⚫ Black Team                        ○  │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #11  Chris Brown                             │  │
│  │       🟡 Yellow Team                       ○  │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### After Voting
```
┌─────────────────────────────────────────────────────┐
│  🏆 Most Valuable Player  [✓ Voted]                  │
│  Best overall player of the season                   │
│  13 votes cast                                       │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #10  John Smith                              │  │
│  │       🔵 Blue Team                            │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #7   Mike Johnson                            │  │
│  │       🔴 Red Team                             │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  #15  Sarah Williams                          │  │
│  │       🟢 Green Team                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  You have already voted for this award              │
└─────────────────────────────────────────────────────┘
```

## 👨‍💼 Admin View

### Award Management Dashboard
```
┌─────────────────────────────────────────────────────┐
│  Award Management                    [Create Award]  │
│  Create awards and manage nominees                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🏆 Most Valuable Player          [Active]  ✓  🗑   │
│  Best overall player of the season                   │
│  Season: 2025 Winter                                 │
│                                                      │
│  [Manage Nominees]  [View Results]                   │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  🏆 Golden Boot                   [Inactive]  ✓  🗑  │
│  Top goal scorer of the season                       │
│  Season: 2025 Winter                                 │
│                                                      │
│  [Manage Nominees]  [View Results]                   │
└─────────────────────────────────────────────────────┘
```

### Create Award Modal
```
┌─────────────────────────────────────────────────────┐
│  Create New Award                               ✕   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Award Name *                                        │
│  ┌────────────────────────────────────────────────┐ │
│  │ Most Valuable Player                           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Description                                         │
│  ┌────────────────────────────────────────────────┐ │
│  │ Best overall player of the season              │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  Season                                              │
│  ┌────────────────────────────────────────────────┐ │
│  │ 2025 Winter                                    │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ☑ Active (users can vote)                          │
│                                                      │
│  [Create Award]  [Cancel]                            │
└─────────────────────────────────────────────────────┘
```

### Manage Nominees Modal
```
┌─────────────────────────────────────────────────────┐
│  Manage Nominees - Most Valuable Player         ✕   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Add Nominee                                         │
│  ┌────────────────────────────────────────────┐ [+] │
│  │ Select a player...                         ▼│    │
│  └────────────────────────────────────────────┘     │
│                                                      │
│  Current Nominees (3)                                │
│  ┌────────────────────────────────────────────────┐ │
│  │  John Smith                                 ✕  │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │  Mike Johnson                               ✕  │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │  Sarah Williams                             ✕  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [Done]                                              │
└─────────────────────────────────────────────────────┘
```

### View Results Modal (Admin Only)
```
┌─────────────────────────────────────────────────────┐
│  Vote Results - Most Valuable Player            ✕   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  #1  Mike Johnson                          8   │ │
│  │                                          votes  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  #2  John Smith                            5   │ │
│  │                                          votes  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  #3  Sarah Williams                        2   │ │
│  │                                          votes  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  [Close]                                             │
└─────────────────────────────────────────────────────┘
```

## 🎨 Visual Elements

### Color Indicators

**Award Status**
- 🟢 Green Badge = Active (users can vote)
- ⚫ Gray Badge = Inactive (voting closed)
- ✓ Green Badge = User has voted

**Selection States**
- ○ Circle = Not selected
- ✓ Check Circle = Selected
- Border highlight = Selected nominee

**Buttons**
- Coral/Rose (#D47F7D) = Primary actions
- Dark background = Secondary actions
- Red hover = Destructive actions

### Icons Used
- 🏆 Trophy = Awards
- ✓ Check = Voted/Active
- ○ Circle = Not selected
- ✕ X = Close/Remove
- + Plus = Add
- 🗑 Trash = Delete
- 👥 Users = Manage nominees

## 📱 Mobile View

### Responsive Layout
```
┌───────────────────────┐
│  Award Voting         │
│  Vote for your        │
│  favorite players     │
└───────────────────────┘

┌───────────────────────┐
│  🏆 MVP    [✓ Voted]  │
│  Best overall player  │
│  12 votes             │
│                       │
│  ┌─────────────────┐  │
│  │  #10 John Smith │  │
│  │  🔵 Blue Team   │  │
│  └─────────────────┘  │
│                       │
│  ┌─────────────────┐  │
│  │  #7 Mike J.     │  │
│  │  🔴 Red Team ✓  │  │
│  └─────────────────┘  │
│                       │
│  [Submit Vote]        │
└───────────────────────┘
```

## 🔄 User Flow Diagram

### Regular User Journey
```
1. Visit /stats page
   ↓
2. See active awards
   ↓
3. Read award descriptions
   ↓
4. Scroll down to view stats table (optional)
   ↓
5. Return to awards section
   ↓
6. Click on preferred nominee
   ↓
7. Click "Submit Vote"
   ↓
8. See "Voted" badge
   ↓
9. Repeat for other awards
```

### Admin Journey
```
1. Login as admin
   ↓
2. Visit /stats page
   ↓
3. See Award Management dashboard
   ↓
4. Click "Create Award"
   ↓
5. Fill in award details
   ↓
6. Click "Manage Nominees"
   ↓
7. Add players from dropdown
   ↓
8. Click "View Results" to monitor
   ↓
9. Toggle active/inactive as needed
```

## 💡 Visual Tips

### For Users
- **Green "Voted" badge** = You already voted
- **Vote count** = Total votes from all users
- **Click nominee card** = Select your choice
- **Highlighted border** = Your current selection
- **Scroll down** = View full stats table

### For Admins
- **Green badge** = Award is active
- **Gray badge** = Award is inactive
- **Checkmark icon** = Toggle active status
- **Trash icon** = Delete award
- **"Manage Nominees"** = Add/remove players
- **"View Results"** = See exact vote counts

## 🎯 Key Visual Features

### Clarity
- Clear award names and descriptions
- Visible vote counts
- Obvious selection states
- Intuitive button labels

### Feedback
- Hover effects on interactive elements
- Color changes on selection
- Success messages after voting
- Confirmation dialogs for destructive actions

### Consistency
- Matches league branding
- Consistent with rest of site
- Familiar UI patterns
- Professional appearance

### Accessibility
- High contrast text
- Large touch targets
- Clear visual hierarchy
- Descriptive labels

## 📊 Stats Table Integration

The award voting section sits **above** the existing stats table:

```
┌─────────────────────────────────────────────────────┐
│  Player Statistics                                   │
│  View all player stats across the league            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  [AWARD VOTING SECTION]                              │
│  (User View or Admin View)                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Filters                                             │
│  [Search] [Team Filter]                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Player Stats Table                                  │
│  [Sortable columns with player data]                │
└─────────────────────────────────────────────────────┘
```

This allows users to:
1. Vote on awards at the top
2. Scroll down to research player stats
3. Make informed voting decisions

---

**Visual Design**: Clean, modern, professional
**User Experience**: Intuitive, responsive, accessible
**Brand Consistency**: Matches YM JAX Soccer League theme


