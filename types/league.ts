/**
 * League configuration type definitions
 */

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

