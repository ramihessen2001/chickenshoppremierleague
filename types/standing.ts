/**
 * League table types.
 *
 * Every field here is computed from completed games (see
 * `lib/standings.ts`) rather than stored, so the table can never drift out
 * of sync with the results it was built from.
 */

export interface Standing {
  teamId: string
  teamName: string
  teamSlug: string
  logoUrl: string | null
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}
