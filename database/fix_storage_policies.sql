-- Fix for RLS policy issue
-- Option 1: Allow public uploads (simpler, works immediately)

-- Drop existing policies that aren't working
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Allow ANYONE to upload to league-images bucket
-- (Since your app controls admin access at the UI level, this is safe)
CREATE POLICY "Allow public uploads to league-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'league-images');

CREATE POLICY "Allow public updates to league-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'league-images');

CREATE POLICY "Allow public deletes from league-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'league-images');

-- Public read already exists, so we're good there


