# Award Voting - Quick Start Guide

## 🚀 Setup (One-Time)

### 1. Run Database Schema
```sql
-- In Supabase SQL Editor, run:
-- database/awards_schema.sql
```

### 2. Verify Setup
Go to `/stats` page - you should see either:
- **Users**: "No active awards at this time"
- **Admins**: "Award Management" interface

## 👨‍💼 Admin Quick Actions

### Create an Award
1. Login as admin (password: `sport2233`)
2. Go to `/stats`
3. Click **"Create Award"**
4. Fill in name, description, season
5. Check "Active" to allow voting
6. Click **"Create Award"**

### Add Nominees
1. Click **"Manage Nominees"** on award card
2. Select player from dropdown
3. Click **"+"** button
4. Repeat for all nominees
5. Click **"Done"**

### View Results (Admin Only)
1. Click **"View Results"** on award card
2. See vote counts and rankings
3. Results update in real-time

### Toggle Award Active/Inactive
1. Click checkmark icon on award card
2. Inactive awards won't show to users

### Delete Award
1. Click trash icon on award card
2. Confirm deletion
3. All nominees and votes will be deleted

## 👥 User Experience

### How Users Vote
1. Go to `/stats` page
2. Browse active awards
3. Click on a nominee to select
4. Click **"Submit Vote"**
5. Award shows "Voted" badge
6. Can scroll down to view stats table

### Voting Rules
- ✅ One vote per award per user
- ✅ Can vote on multiple awards
- ❌ Cannot change vote after submission
- ❌ Cannot vote on inactive awards

## 📊 Suggested Awards

Quick copy-paste templates:

**MVP**
- Name: Most Valuable Player
- Description: Best overall player of the season

**Golden Boot**
- Name: Golden Boot
- Description: Top goal scorer of the season

**Best Goalkeeper**
- Name: Best Goalkeeper
- Description: Outstanding goalkeeper performance

**Best Defender**
- Name: Best Defender
- Description: Exceptional defensive play

**Rookie of the Year**
- Name: Rookie of the Year
- Description: Best first-year player

## 🔍 Finding Players

Use the stats table on `/stats` page to:
- Sort by goals, assists, saves
- Filter by team
- Search by name or jersey number
- Identify top performers

## ⚠️ Common Issues

**"Failed to create award"**
→ Make sure you're logged in as admin

**"Failed to submit vote"**
→ User already voted for this award

**Nominees not showing**
→ Refresh the page

**Vote counts not updating**
→ Refresh the page

## 📱 Mobile Support

✅ Fully responsive design
✅ Works on all devices
✅ Touch-friendly interface

## 🎯 Typical Workflow

### End of Season
1. **Week 1**: Create awards, add nominees
2. **Week 2**: Announce voting is open
3. **Week 3**: Monitor results, remind users
4. **Week 4**: Close voting (set inactive)
5. **Week 5**: Announce winners!

---

**Need more details?** See `AWARD_VOTING_SETUP.md`


