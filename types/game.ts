/**
 * Game types.
 */

import { GameStatistic } from './statistic'
import { Player } from './player'

export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'

export interface Game {
  id: string
  /** Sequential number. Regular season counts from 1, playoffs from 100. */
  gameNumber?: number
  /** Week in the season. 0 means a playoff game. */
  weekNumber: number
  /** ISO date, YYYY-MM-DD. */
  date: string
  /** Display time, e.g. "6:00 PM". */
  time: string
  location: string

  /** Team slugs -- what the UI works in. Empty string for an unfilled slot. */
  homeTeamId: string
  awayTeamId: string
  /** Team UUIDs -- required when writing back to the database. */
  homeTeamUUID?: string
  awayTeamUUID?: string

  homeScore: number | null
  awayScore: number | null
  status: GameStatus

  isPlayoff?: boolean
  /** play-in | quarterfinal | semifinal | final */
  playoffRound?: string | null

  /** YouTube URL. The game is live when this is set and status is in_progress. */
  streamUrl?: string | null

  statistics: GameStatistic[]

  playerOfGameId?: string | null
  playerOfGame?: Player | null

  createdAt: string
  updatedAt: string
}
