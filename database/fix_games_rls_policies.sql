-- Fix RLS policies for updating player_of_game_id in games table

-- Check current policies on games table
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'games';

-- Drop any conflicting policies
DROP POLICY IF EXISTS "Allow public updates to games" ON games;
DROP POLICY IF EXISTS "Allow authenticated update" ON games;
DROP POLICY IF EXISTS "Authenticated users can update" ON games;

-- Create policy to allow public updates (your app controls admin at UI level)
CREATE POLICY "Allow public updates to games"
ON games FOR UPDATE
USING (true)
WITH CHECK (true);

-- Also ensure public can read games
CREATE POLICY IF NOT EXISTS "Allow public read of games"
ON games FOR SELECT
USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'games';


