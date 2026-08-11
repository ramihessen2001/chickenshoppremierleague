/**
 * Game type definitions for YM Soccer League
 * Represents a scheduled or completed soccer match
 */

import { GameStatistic } from './statistic'
import { Player } from './player'

export type GameStatus = 'scheduled' | 'completed' | 'cancelled' | 'postponed'

export interface Game {
  id: string                    // Unique identifier
  weekNumber: number            // Week in season (1-12)
  date: string                  // ISO 8601 date (YYYY-MM-DD)
  time: string                  // 12-hour format (e.g., "6:00 PM")
  location: string              // Field location (e.g., "Field 3, Mandarin Park")
  homeTeamId: string            // Foreign key to Team.id
  awayTeamId: string            // Foreign key to Team.id
  homeScore: number | null      // Final score for home team (null if not played)
  awayScore: number | null      // Final score for away team (null if not played)
  status: GameStatus            // Game status
  statistics: GameStatistic[]   // Box score statistics
  playerOfGameId?: string | null // Player selected as Puro Man of The Match
  playerOfGame?: Player | null  // Full player object (when fetched with join)
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
}

