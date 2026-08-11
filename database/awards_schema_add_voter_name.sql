-- Migration to add voter_name to award_votes table
-- Run this AFTER the initial awards_schema.sql

-- Add voter_name column to award_votes table
ALTER TABLE award_votes 
ADD COLUMN voter_name VARCHAR(255);

-- Create index for voter name lookups
CREATE INDEX idx_award_votes_voter_name ON award_votes(voter_name);

-- Update the comment
COMMENT ON COLUMN award_votes.voter_name IS 'Name of the person who voted (optional for accountability)';

