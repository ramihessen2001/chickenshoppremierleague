/**
 * Supabase client for the browser.
 *
 * This module is safe to import from client components. It only ever holds the
 * anon key, which under our RLS policies can read but never write.
 *
 * Writes live in `lib/supabaseAdmin.ts`, which is server-only and must never be
 * imported from a client component.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env.local ' +
      'and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Database row types -- these mirror database/schema.sql.
 */

export interface Team {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  name: string
  /** Null when the player has not been given a shirt number yet. */
  jersey_number: number | null
  team_id: string
  is_active: boolean
  position?: string
  created_at: string
  updated_at: string
}

export type GameStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'postponed'

export interface Game {
  id: string
  game_number: number
  week_number: number | null
  date: string
  time: string
  location: string
  home_team_id: string | null
  away_team_id: string | null
  home_score: number | null
  away_score: number | null
  status: GameStatus
  is_playoff: boolean
  playoff_round?: string | null
  player_of_game_id?: string | null
  /** YouTube URL. Live when set and status is 'in_progress'. */
  stream_url?: string | null
  created_at: string
  updated_at: string
}

export type StatType =
  | 'goal'
  | 'assist'
  | 'save'
  | 'yellow_card'
  | 'red_card'
  | 'blue_card'

export interface GameStatistic {
  id: string
  game_id: string
  player_id: string
  team_id: string
  stat_type: StatType
  count?: number
  timestamp?: string
  created_at: string
}

/** Where the league is in its lifecycle. Drives what the homepage leads with. */
export type LeaguePhase =
  | 'signups'
  | 'draft'
  | 'season'
  | 'playoffs'

export interface LeagueConfig {
  id: string
  league_name: string
  season: string
  start_date: string
  end_date: string
  current_week: number
  total_weeks: number
  phase: LeaguePhase
  draft_stream_url?: string | null
  updated_at: string
}

export type SignupStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlisted'
  | 'withdrawn'
  | 'drafted'

export interface Signup {
  id: string
  name: string
  /** Null only when the player left it out and gave a phone number instead. */
  email?: string | null
  age?: number | null
  phone?: string | null
  position?: string | null
  experience?: string | null
  /** What the player wants printed on their kit, and the size to order. */
  jersey_name?: string | null
  /** Requested squad number. Not the number they end up with -- that is
   *  assigned on the roster, where it has to be unique within a team. */
  jersey_number?: number | null
  jersey_size?: string | null
  notes?: string | null
  status: SignupStatus
  /** When the sign-up fee was received. Null means unpaid. */
  paid_at?: string | null
  /** How it was received: Zelle, Cash App, Venmo, cash… */
  payment_method?: string | null
  drafted_team_id?: string | null
  season: string
  created_at: string
  updated_at: string
}

export type QuestionStatus = 'new' | 'answered'

/** A message sent through the contact form. */
export interface Question {
  id: string
  name: string
  email: string
  message: string
  status: QuestionStatus
  created_at: string
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
