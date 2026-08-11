# Award Voting System Setup Guide

This guide will help you set up the award voting system for the YM JAX Soccer League application.

## 📋 Overview

The award voting system allows:
- **Users**: Vote for nominees in various award categories (MVP, Golden Boot, etc.)
- **Admins**: Create awards, add nominees, and view vote results

## 🗄️ Database Setup

### Step 1: Run the Awards Schema

Execute the SQL schema to create the necessary tables in your Supabase database:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `database/awards_schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** to execute

This will create three new tables:
- `awards` - Stores award information
- `award_nominees` - Links players to awards
- `award_votes` - Tracks user votes

### Step 2: Verify Tables

After running the schema, verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('awards', 'award_nominees', 'award_votes');
```

You should see all three tables listed.

## 🎯 Features

### For Users (Public)

**Location**: `/stats` page

Users can:
1. View all active awards
2. See nominees for each award
3. Vote for one nominee per award
4. See total vote counts (but not individual results)
5. View which awards they've already voted on

**Voting Protection**:
- One vote per award per user
- Uses browser localStorage to track voter identity
- Cannot change vote after submission

### For Admins

**Location**: `/stats` page (when logged in as admin)

Admins can:
1. **Create Awards**
   - Set award name (e.g., "MVP", "Golden Boot")
   - Add description
   - Set season
   - Toggle active/inactive status

2. **Manage Nominees**
   - Add players to awards
   - Remove nominees
   - View all nominees for each award

3. **View Vote Results** (Admin Only)
   - See exact vote counts for each nominee
   - View rankings
   - Monitor voting progress

## 🚀 Usage Guide

### Creating Your First Award (Admin)

1. **Login as Admin**
   - Click the "ADMIN" button in the footer
   - Enter password: `sport2233`

2. **Navigate to Stats Page**
   - Go to `/stats` route
   - You'll see the "Award Management" interface

3. **Create an Award**
   - Click "Create Award" button
   - Fill in:
     - **Name**: e.g., "Most Valuable Player"
     - **Description**: e.g., "Best overall player of the season"
     - **Season**: e.g., "2025 Winter"
     - **Active**: Check to allow voting
   - Click "Create Award"

4. **Add Nominees**
   - Click "Manage Nominees" on the award card
   - Select a player from the dropdown
   - Click the "+" button to add
   - Repeat for all nominees
   - Click "Done" when finished

5. **View Results**
   - Click "View Results" on the award card
   - See real-time vote counts
   - Rankings update automatically

### Voting as a User

1. **Navigate to Stats Page**
   - Go to `/stats` route
   - You'll see the "Award Voting" interface

2. **Browse Awards**
   - View all active awards
   - Read descriptions
   - See all nominees with their stats

3. **Cast Your Vote**
   - Click on a nominee to select them
   - Click "Submit Vote" button
   - Confirmation will appear
   - Award will show "Voted" badge

4. **Use Stats Table**
   - Scroll down to view the full player statistics table
   - Use filters and search to find players
   - Compare stats to make informed voting decisions

## 📊 Example Awards

Here are some common award types you might want to create:

### 1. Most Valuable Player (MVP)
- **Description**: Best overall player of the season
- **Criteria**: Leadership, skill, impact on games

### 2. Golden Boot
- **Description**: Top goal scorer of the season
- **Criteria**: Most goals scored

### 3. Best Goalkeeper
- **Description**: Outstanding goalkeeper performance
- **Criteria**: Most saves, clean sheets

### 4. Best Defender
- **Description**: Exceptional defensive play
- **Criteria**: Tackles, interceptions, leadership

### 5. Rookie of the Year
- **Description**: Best first-year player
- **Criteria**: Performance, potential, improvement

### 6. Most Improved Player
- **Description**: Greatest improvement from previous season
- **Criteria**: Skill development, consistency

## 🔒 Security & Voting Integrity

### Voter Identification
- Each user gets a unique identifier stored in localStorage
- Format: `voter_{timestamp}_{random}`
- Persists across browser sessions
- Cleared if user clears browser data

### Vote Protection
- Database enforces one vote per award per voter
- Duplicate votes are rejected
- No vote modification after submission

### Admin Access
- Only admins can:
  - Create/edit/delete awards
  - Add/remove nominees
  - View detailed vote results
- Public users only see total vote counts

## 🎨 UI Features

### User Interface
- Clean, modern design matching league branding
- Responsive layout (mobile & desktop)
- Visual feedback for selections
- "Voted" badges for completed votes
- Real-time vote count updates

### Admin Interface
- Comprehensive management dashboard
- Modal-based workflows
- Inline editing capabilities
- Confirmation dialogs for destructive actions
- Real-time results viewing

## 🔧 Technical Details

### Files Created
```
database/
  └── awards_schema.sql          # Database schema

lib/
  ├── supabase.ts                # Updated with Award interfaces
  └── supabaseAwards.ts          # Award data functions

app/components/
  ├── AwardManagement.tsx        # Admin interface
  ├── AwardVoting.tsx            # User voting interface
  └── PlayerStatsClient.tsx      # Updated stats page
```

### Database Tables

**awards**
- `id` (UUID, primary key)
- `name` (VARCHAR)
- `description` (TEXT)
- `season` (VARCHAR)
- `is_active` (BOOLEAN)
- `voting_start_date` (TIMESTAMPTZ)
- `voting_end_date` (TIMESTAMPTZ)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**award_nominees**
- `id` (UUID, primary key)
- `award_id` (UUID, foreign key → awards)
- `player_id` (UUID, foreign key → players)
- `created_at` (TIMESTAMPTZ)

**award_votes**
- `id` (UUID, primary key)
- `award_id` (UUID, foreign key → awards)
- `nominee_id` (UUID, foreign key → award_nominees)
- `voter_identifier` (VARCHAR)
- `voted_at` (TIMESTAMPTZ)

### Row Level Security (RLS)
- ✅ Public can read awards and nominees
- ✅ Public can insert votes
- ✅ Public can read votes (to check if they voted)
- ✅ Admins can manage awards and nominees
- ✅ Admins can delete votes if needed

## 🐛 Troubleshooting

### "Failed to create award"
- Check that you're logged in as admin
- Verify Supabase service key is set in `.env.local`
- Check browser console for errors

### "Failed to submit vote"
- User may have already voted for this award
- Check that award is active
- Verify database connection

### Nominees not showing
- Ensure players exist in the database
- Check that nominees were added correctly
- Refresh the page

### Vote counts not updating
- Refresh the page to see latest counts
- Check database connection
- Verify RLS policies are correct

## 📝 Best Practices

1. **Create Awards Early**
   - Set up awards at the start of the season
   - Keep them inactive until voting should begin

2. **Choose Nominees Wisely**
   - Select 3-5 nominees per award
   - Use stats table to identify top performers
   - Ensure nominees are from different teams when possible

3. **Timing**
   - Open voting near end of season
   - Give users 1-2 weeks to vote
   - Close voting before awards ceremony

4. **Communication**
   - Announce awards on social media
   - Remind users to vote
   - Share results after voting closes

## 🎉 Next Steps

1. Run the database schema
2. Login as admin
3. Create your first award
4. Add nominees
5. Share the voting link with your league
6. Monitor results in real-time
7. Announce winners!

## 📞 Support

If you encounter any issues:
1. Check this guide first
2. Review browser console for errors
3. Check Supabase logs
4. Verify environment variables

---

**Happy Voting! 🏆**


