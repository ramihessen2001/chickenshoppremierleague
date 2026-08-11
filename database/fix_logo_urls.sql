-- Fix team logo URLs in Supabase
-- Changes /league_data/images/ to /images/ so Next.js can find them

UPDATE teams
SET logo_url = REPLACE(logo_url, '/league_data/images/', '/images/')
WHERE logo_url LIKE '/league_data/images/%';

-- Verify the update
SELECT name, logo_url FROM teams ORDER BY name;


