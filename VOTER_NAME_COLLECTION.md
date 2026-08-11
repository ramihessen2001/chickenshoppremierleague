# Voter Name Collection - Setup Guide

## Overview

The award voting system now collects voter names when they submit their votes. This adds accountability and allows admins to see exactly who voted for each nominee.

## 📦 What Changed

### 1. Database Schema
- Added `voter_name` column to `award_votes` table
- Names are stored with each vote
- Indexed for fast lookups

### 2. User Experience
- **First Vote**: Users are prompted to enter their name
- **Subsequent Votes**: Name is saved and reused automatically
- **Display**: Current voter name shown in voting interface
- **Storage**: Name saved in localStorage for convenience

### 3. Admin View
- **Vote Results**: Shows voter names under each nominee
- **Anonymous Tracking**: Shows count of anonymous votes (from before this feature)
- **Detailed View**: Admins can see exactly who voted for whom

## 🚀 Setup Instructions

### Step 1: Run Database Migration

In your Supabase SQL Editor, run:

```sql
-- Add voter_name column to award_votes table
ALTER TABLE award_votes 
ADD COLUMN voter_name VARCHAR(255);

-- Create index for voter name lookups
CREATE INDEX idx_award_votes_voter_name ON award_votes(voter_name);

-- Update the comment
COMMENT ON COLUMN award_votes.voter_name IS 'Name of the person who voted (optional for accountability)';
```

Or simply run the file:
```bash
database/awards_schema_add_voter_name.sql
```

### Step 2: Deploy Code

The code changes are already in place:
- ✅ `AwardVoting.tsx` - Name collection modal
- ✅ `AwardManagement.tsx` - Admin results with names
- ✅ `supabaseAwards.ts` - Updated functions
- ✅ `supabase.ts` - Updated interfaces

### Step 3: Test

1. **As a User:**
   - Go to `/stats`
   - Select a nominee
   - Click "Submit Vote"
   - Enter your name in the modal
   - Vote is submitted with your name
   - Future votes use the same name automatically

2. **As an Admin:**
   - Login as admin
   - Go to `/stats`
   - Click "View Results" on any award
   - See voter names listed under each nominee

## 🎯 Features

### User Features

**Name Prompt Modal**
- Appears on first vote
- Clean, simple interface
- Name saved for future votes
- Can press Enter to submit

**Persistent Name**
- Stored in localStorage as `voter_name`
- Automatically used for all future votes
- Shown at top of voting interface
- Can be cleared by clearing browser data

**Visual Feedback**
- "Voting as: [Your Name]" displayed
- Confirmation after successful vote
- Clear modal design

### Admin Features

**Detailed Vote Results**
- See all voter names per nominee
- Vote count remains prominent
- Anonymous votes tracked separately
- Scrollable list for many voters

**Vote Transparency**
- Complete visibility into voting
- Easy to verify legitimate votes
- Can identify duplicate attempts
- Useful for auditing

## 📋 User Flow

### First-Time Voter
```
1. Visit /stats
2. Select nominee
3. Click "Submit Vote"
4. Modal appears: "Enter Your Name"
5. Type name → Click "Submit Vote"
6. Vote recorded with name
7. Name saved for future votes
```

### Returning Voter
```
1. Visit /stats
2. See "Voting as: John Smith" at top
3. Select nominee
4. Click "Submit Vote"
5. Vote submitted immediately (no modal)
6. Name automatically included
```

### Admin Viewing Results
```
1. Login as admin
2. Go to /stats
3. Click "View Results"
4. See nominees ranked by votes
5. Under each nominee:
   - Badge: "John Smith"
   - Badge: "Jane Doe"
   - Badge: "+2 anonymous"
```

## 🔒 Privacy & Security

### Data Collected
- ✅ Voter name (self-reported)
- ✅ Voter identifier (localStorage ID)
- ✅ Timestamp of vote
- ❌ No email or contact info required

### Admin Access Only
- Regular users see only vote counts
- Admin login required to see names
- Names not visible in public view
- Database secured with RLS policies

### Opt-Out
- Name field is technically optional in database
- Could be left blank (though UI requires it)
- Anonymous votes from before feature are preserved

## 🎨 UI Components

### Name Prompt Modal
```
┌─────────────────────────────────┐
│  Enter Your Name                │
│  Please enter your name to      │
│  complete your vote.            │
│                                 │
│  Your Name *                    │
│  [________________]             │
│                                 │
│  [Submit Vote] [Cancel]         │
└─────────────────────────────────┘
```

### Voting Header (After Name Saved)
```
┌─────────────────────────────────┐
│  Award Voting     Voting as:    │
│  Vote for...      John Smith    │
└─────────────────────────────────┘
```

### Admin Results View
```
┌─────────────────────────────────┐
│  #1  Mike Johnson          8    │
│                          votes  │
│  ─────────────────────────────  │
│  Voted by:                      │
│  [John Smith] [Jane Doe]        │
│  [Bob Lee] [+5 more]           │
└─────────────────────────────────┘
```

## 🐛 Troubleshooting

### "Name not saving"
- Check browser allows localStorage
- Try clearing site data and re-entering
- Verify localStorage key: `voter_name`

### "Anonymous votes showing"
- These are from before the feature
- Normal and expected behavior
- Future votes will include names

### "Modal keeps appearing"
- localStorage may be disabled
- Try a different browser
- Check browser privacy settings

## 📊 Database Schema

### award_votes Table (Updated)
```sql
CREATE TABLE award_votes (
  id UUID PRIMARY KEY,
  award_id UUID NOT NULL,
  nominee_id UUID NOT NULL,
  voter_identifier VARCHAR(255) NOT NULL,
  voter_name VARCHAR(255),           -- NEW!
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(award_id, voter_identifier)
);
```

### Example Data
```
id    | award_id | nominee_id | voter_identifier  | voter_name
------|----------|------------|-------------------|------------
uuid1 | award-1  | nom-1      | voter_123_abc     | John Smith
uuid2 | award-1  | nom-2      | voter_124_def     | Jane Doe
uuid3 | award-2  | nom-3      | voter_123_abc     | John Smith
```

## ✅ Benefits

### For Users
- Simple, one-time name entry
- Name remembered automatically
- No account creation needed
- Clear voting attribution

### For Admins
- Full transparency on votes
- Easy to verify authenticity
- Can identify trends
- Useful for announcements

### For the League
- Increased accountability
- Reduced fraud potential
- Better vote tracking
- Professional appearance

## 🔮 Future Enhancements

Possible additions:
- Edit name after saving
- Email notifications
- Public voter lists (optional)
- Certificate generation with voter names
- Export results with names to CSV

---

**Implementation Complete!** ✅
- Database schema updated
- UI components built
- Admin view enhanced
- Build passing
- Ready for production

