/**
 * Statistic types.
 */

export type StatType =
  | 'goal'
  | 'assist'
  | 'save'
  | 'yellow_card'
  | 'red_card'
  | 'blue_card'

export interface GameStatistic {
  id: string
  gameId: string
  playerId: string
  /** Joined in for display. */
  playerName?: string
  /** Joined in for display; null when the player has no shirt number. */
  jerseyNumber?: number | null
  /** Team slug. */
  teamId: string
  type: StatType
  /** How many, e.g. 2 if the player scored twice. Defaults to 1. */
  count?: number
  /** Optional in-game clock, e.g. "23:45". */
  timestamp?: string
  createdAt: string
}

export interface LeaderboardEntry {
  player: {
    id: string
    name: string
    teamId: string
  }
  count: number
}
