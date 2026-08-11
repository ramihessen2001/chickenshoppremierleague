/**
 * Game statistic type definitions for YM Soccer League
 * Represents individual statistic events in a game
 */

export type StatType = 'goal' | 'assist' | 'save' | 'yellow_card' | 'red_card' | 'blue_card'

export interface GameStatistic {
  id: string                    // Unique identifier
  gameId: string                // Foreign key to Game.id
  playerId: string              // Foreign key to Player.id
  playerName?: string           // Player name (for display)
  jerseyNumber?: number         // Player jersey number (for display)
  teamId: string                // Foreign key to Team.id
  type: StatType                // Type of statistic
  count?: number                // For goals, assists, saves (can have multiples)
  timestamp?: string            // Optional: time in game (e.g., "23:45")
  createdAt: string             // ISO 8601 timestamp
}

export interface LeaderboardEntry {
  player: {
    id: string
    name: string
    teamId: string
  }
  count: number
}

