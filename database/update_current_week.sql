-- Check current week setting
SELECT * FROM league_config;

-- Update current week to the week you want to display on homepage
-- Change the number below to match which "Day" you want to show as "TODAY'S GAMES"
-- For example, if you want to show Day 2 games, set current_week = 2

UPDATE league_config 
SET current_week = 2,  -- Change this number to the day you want to display
    updated_at = NOW()
WHERE id IS NOT NULL;

-- Verify the update
SELECT * FROM league_config;



