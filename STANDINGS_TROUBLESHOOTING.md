# Standings Feature - Quick Setup & Troubleshooting

## 🚨 Getting "Failed to upload" Error?

Follow these steps to fix it:

---

## Step 1: Add Database Column

Run this SQL in Supabase SQL Editor:

```sql
-- Add standings_image_url column
ALTER TABLE league_config
ADD COLUMN IF NOT EXISTS standings_image_url TEXT;
```

**To verify it worked:**
```sql
-- Check if column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'league_config';
```

You should see `standings_image_url` in the results.

---

## Step 2: Create Storage Bucket

### In Supabase Dashboard:

1. Go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Enter bucket name: `league-images`
4. Set to **Public** ✅
5. Click **"Create bucket"**

### Or use SQL:

```sql
-- Create storage bucket (if using SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('league-images', 'league-images', true);
```

---

## Step 3: Set Storage Policies

Run this SQL in Supabase SQL Editor:

```sql
-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'league-images');

-- Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'league-images');

-- Allow authenticated users to update
CREATE POLICY IF NOT EXISTS "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'league-images');

-- Allow authenticated users to delete
CREATE POLICY IF NOT EXISTS "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'league-images');
```

---

## Step 4: Verify Setup

Run this SQL to check everything:

```sql
-- Check if column exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'league_config' 
  AND column_name = 'standings_image_url'
) as column_exists;

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'league-images';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%league-images%';
```

---

## 🎯 Common Error Messages & Fixes

### "Bucket not found" or "Storage error"
**Fix:** Create the `league-images` bucket (Step 2)

### "Permission denied" or "Policy violation"
**Fix:** Set storage policies (Step 3)

### "Column 'standings_image_url' does not exist"
**Fix:** Add the database column (Step 1)

### "new row violates check constraint"
**Fix:** Make sure you're logged in as admin

---

## 🧪 Test the Upload

1. Refresh the `/standings` page
2. Make sure you're logged in as admin
3. Try uploading a small test image (< 1MB)
4. Check browser console for detailed error messages
5. The new error messages will tell you exactly what failed

---

## 📞 Still Having Issues?

Check the browser console (F12 → Console tab) for the detailed error message. The new code will show:
- "Upload failed: [specific error]" - Storage issue
- "Database update failed: [specific error]" - Database issue

Share that error message for more specific help!


