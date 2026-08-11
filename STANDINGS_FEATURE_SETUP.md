# League Standings Feature Setup Guide

## 🎯 Overview

The league standings feature allows admins to upload a standings image that will be displayed on the `/standings` page. Users can access this page via a "View Standings" button on the homepage.

## 📋 What Was Added

### 1. New Route: `/standings`
- **File**: `app/standings/page.tsx`
- Displays the league standings image
- Admin upload interface (for admins only)

### 2. Client Component: `StandingsPageClient`
- **File**: `app/components/StandingsPageClient.tsx`
- Fetches standings image from Supabase
- Provides admin upload interface
- Displays the standings image

### 3. Homepage Button
- **File**: `app/components/WeeklyGames.tsx`
- Added "View Standings" button next to "View Full Season Schedule"
- Same styling for consistency

### 4. Database Changes
- Added `standings_image_url` column to `league_config` table
- Migration file: `database/migrations/add_standings_image_url.sql`

### 5. TypeScript Updates
- Updated `LeagueConfig` interface in:
  - `lib/supabase.ts`
  - `types/league.ts`

## 🚀 Setup Instructions

### Step 1: Run Database Migration

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Add standings_image_url column to league_config table
ALTER TABLE league_config
ADD COLUMN standings_image_url TEXT;

COMMENT ON COLUMN league_config.standings_image_url IS 'URL of the uploaded league standings image';
```

**Location**: `database/migrations/add_standings_image_url.sql`

### Step 2: Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create a new bucket called `league-images`
3. Set bucket to **Public** (so images can be viewed without authentication)

**Bucket Settings:**
- Name: `league-images`
- Public: ✅ Yes
- File size limit: 5MB (recommended)
- Allowed MIME types: `image/*`

### Step 3: Set Storage Policies (Optional but Recommended)

In Supabase SQL Editor, run:

```sql
-- Allow public read access to league-images bucket
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'league-images');

-- Allow authenticated users (admins) to upload/update
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'league-images');

CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'league-images');

CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'league-images');
```

### Step 4: Verify Setup

1. Start the development server: `npm run dev`
2. Go to homepage: `http://localhost:3000`
3. You should see "View Standings" button
4. Click it to go to `/standings`
5. Login as admin to see upload interface

## 📖 How to Use

### For Users:
1. Go to homepage
2. Click "View Standings" button
3. View the current league standings image

### For Admins:
1. Login as admin (enter admin password in banner)
2. Navigate to `/standings`
3. You'll see an "Admin: Upload Standings Image" section
4. Click "Choose File" and select an image (PNG/JPG, max 5MB)
5. The image will upload automatically
6. The new standings will display immediately
7. Users will see the updated standings on their next visit

## 🎨 Features

### User Experience:
- ✅ Clean, responsive layout
- ✅ Back button to return home
- ✅ Large, clear standings display
- ✅ Loading states
- ✅ Empty state when no image uploaded

### Admin Experience:
- ✅ Simple file upload interface
- ✅ File validation (type and size)
- ✅ Upload progress indicator
- ✅ Instant preview after upload
- ✅ Success/error feedback

### Technical:
- ✅ Stores images in Supabase Storage
- ✅ Public URL for fast loading
- ✅ TypeScript type safety
- ✅ Optimized Next.js Image component
- ✅ Responsive design

## 🎯 File Structure

```
ym_soccer/
├── app/
│   ├── standings/
│   │   └── page.tsx                    # Standings page route
│   └── components/
│       ├── StandingsPageClient.tsx     # Main standings component
│       └── WeeklyGames.tsx             # Updated with standings button
├── database/
│   └── migrations/
│       └── add_standings_image_url.sql # Database migration
├── lib/
│   └── supabase.ts                     # Updated LeagueConfig interface
└── types/
    └── league.ts                       # Updated LeagueConfig type
```

## 🔧 Configuration

### Supabase Storage Bucket
- **Bucket Name**: `league-images`
- **Public Access**: Yes
- **Max File Size**: 5MB
- **Allowed Types**: All image formats (PNG, JPG, JPEG, GIF, WebP)

### Database Column
- **Table**: `league_config`
- **Column**: `standings_image_url`
- **Type**: TEXT
- **Nullable**: Yes (NULL if no image uploaded)

## 📊 Data Flow

1. **Upload**: Admin selects image → Uploads to Supabase Storage → Gets public URL → Saves URL to `league_config` table
2. **Display**: Page loads → Fetches `standings_image_url` from `league_config` → Displays image using Next.js Image component
3. **Update**: Admin uploads new image → Old URL replaced → New image displays immediately

## 🎨 Styling

The standings page uses the same design system as the rest of the app:
- Background: Gradient (`#A0CAC9` to `#FFE0AF`)
- Borders: `#523232`
- Buttons: `#D47F7D`
- Typography: Black with gray accents

## 🚨 Troubleshooting

### Image Not Displaying
1. Check if `league-images` bucket exists in Supabase Storage
2. Verify bucket is set to Public
3. Check browser console for errors
4. Verify URL in `league_config.standings_image_url`

### Upload Failing
1. Ensure user is logged in as admin
2. Check file size (must be < 5MB)
3. Verify file type is an image
4. Check Supabase Storage policies
5. Check browser console for errors

### Button Not Showing on Homepage
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server: `npm run dev`
3. Hard refresh browser (Cmd+Shift+R)

## ✅ Testing Checklist

- [ ] Database migration ran successfully
- [ ] `league-images` bucket created in Supabase
- [ ] Bucket is public
- [ ] "View Standings" button appears on homepage
- [ ] `/standings` page loads without errors
- [ ] Admin can see upload interface when logged in
- [ ] Admin can upload an image
- [ ] Uploaded image displays correctly
- [ ] Non-admins cannot see upload interface
- [ ] Non-admins can view uploaded image
- [ ] Back button returns to homepage

## 🎉 Status

**COMPLETE** - All features implemented and ready to use!

The standings feature is now fully integrated into the YM Soccer League application. Admins can upload standings images, and users can view them on the dedicated `/standings` page accessible from the homepage.


