-- Fix RLS policies for league_config table
-- This allows public updates to the league_config table (specifically for standings_image_url)

-- First, check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'league_config';

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Allow authenticated update" ON league_config;
DROP POLICY IF EXISTS "Authenticated users can update" ON league_config;

-- Create new policy that allows public updates
CREATE POLICY "Allow public updates to league_config"
ON league_config FOR UPDATE
USING (true)
WITH CHECK (true);

-- Also ensure public can read
CREATE POLICY IF NOT EXISTS "Allow public read of league_config"
ON league_config FOR SELECT
USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'league_config';


