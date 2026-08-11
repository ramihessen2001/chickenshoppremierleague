/**
 * Supabase Client Configuration
 * 
 * This creates a Supabase client for accessing the YM Soccer League database.
 * Uses environment variables from .env.local for configuration.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  )
}

// Client for read operations (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Client for admin write operations (uses service role key if available)
// This bypasses RLS policies for authenticated operations
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

if (!supabaseServiceKey) {
  console.error('⚠️ NEXT_PUBLIC_SUPABASE_SERVICE_KEY is not set! Admin operations will fail.')
} else {
  console.log('✅ Service key loaded for admin operations')
}

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : supabase // Fallback to regular client if service key not available

/**
 * Database Types
 * These match the schema in database/schema.sql
 */

export interface Team {
  id: string
  name: string
  slug: string
  logo_url: string
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  name: string
  jersey_number: number
  team_id: string
  is_active: boolean
  position?: string
  created_at: string
  updated_at: string
}

export interface Game {
  id: string
  game_number: number
  week_number: number | null
  date: string
  time: string
  location: string
  home_team_id: string
  away_team_id: string
  home_score: number | null
  away_score: number | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
  is_playoff: boolean
  playoff_round?: string | null
  created_at: string
  updated_at: string
}

export interface GameStatistic {
  id: string
  game_id: string
  player_id: string
  team_id: string
  stat_type: 'goal' | 'assist' | 'save' | 'yellow_card' | 'red_card' | 'blue_card'
  count?: number
  timestamp?: string
  created_at: string
}

export interface LeagueConfig {
  id: string
  league_name: string
  season: string
  start_date: string
  end_date: string
  current_week: number
  total_weeks: number
  standings_image_url?: string
  updated_at: string
}

export interface Award {
  id: string
  name: string
  description?: string
  season: string
  is_active: boolean
  voting_start_date?: string
  voting_end_date?: string
  created_at: string
  updated_at: string
}

export interface AwardNominee {
  id: string
  award_id: string
  player_id: string
  created_at: string
}

export interface AwardVote {
  id: string
  award_id: string
  nominee_id: string
  voter_identifier: string
  voter_name?: string
  voted_at: string
}

