/**
 * League table types.
 *
 * `goalDifference` and `points` are always computed from the other fields
 * (see `lib/standings.ts`), never stored, so they can't drift out of sync
 * with the games/wins/draws/losses/goals a row was built from.
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

/** The columns an admin edits; everything else on a Standing is derived. */
export interface StandingWriteFields {
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
}
