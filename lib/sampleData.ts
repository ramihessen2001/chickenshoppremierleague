/**
 * Sample data for YM JAX Soccer League (Phase 1)
 * Hardcoded data for games, statistics, and leaderboards
 * Future: Replace with dynamic data source
 */

import { Game } from '@/types/game'
import { GameStatistic } from '@/types/statistic'
import { Player } from '@/types/player'

// League configuration
export const LEAGUE_CONFIG = {
  leagueName: 'YM JAX SOCCER LEAGUE',
  season: '2025 Winter',
  startDate: '2025-01-08', // League start date for day calculation
  endDate: '2025-03-26',
  currentWeek: 1, // Actually represents current day
  totalWeeks: 12  // Actually represents total days
}

// Sample players (subset for statistical leaders)
export const SAMPLE_PLAYERS: Player[] = [
  { id: 'p1', name: 'Omar Helmy', jerseyNumber: 7, teamId: 'eagles', isActive: true, position: 'Forward', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'p2', name: 'Ahmed Hassan', jerseyNumber: 10, teamId: 'panthers', isActive: true, position: 'Midfielder', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'p3', name: 'Rafe Mohammad', jerseyNumber: 5, teamId: 'lions', isActive: true, position: 'Forward', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'p4', name: 'Adam Abu Maali', jerseyNumber: 12, teamId: 'dolphins', isActive: true, position: 'Goalkeeper', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'p5', name: 'Yusuf Ali', jerseyNumber: 9, teamId: 'knights', isActive: true, position: 'Forward', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'p6', name: 'Kareem Abdullah', jerseyNumber: 1, teamId: 'warriors', isActive: true, position: 'Goalkeeper', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'p7', name: 'Bilal Sheikh', jerseyNumber: 8, teamId: 'eagles', isActive: true, position: 'Midfielder', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
  { id: 'p8', name: 'Hamza Mahmoud', jerseyNumber: 11, teamId: 'panthers', isActive: true, position: 'Forward', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
]

// Sample games for current week (Week 3)
export const CURRENT_WEEK_GAMES: Game[] = [
  {
    id: 'g7',
    weekNumber: 3,
    date: '2025-01-22',
    time: '6:00 PM',
    location: 'Field 3, Mandarin Park',
    homeTeamId: 'eagles',
    awayTeamId: 'panthers',
    homeScore: 5,
    awayScore: 3,
    status: 'completed',
    statistics: [
      { id: 's7-1', gameId: 'g7', playerId: 'p1', teamId: 'eagles', type: 'goal', count: 3, createdAt: '2025-01-22T20:00:00Z' },
      { id: 's7-2', gameId: 'g7', playerId: 'p7', teamId: 'eagles', type: 'goal', count: 2, createdAt: '2025-01-22T20:05:00Z' },
      { id: 's7-3', gameId: 'g7', playerId: 'p2', teamId: 'panthers', type: 'goal', count: 2, createdAt: '2025-01-22T20:10:00Z' },
      { id: 's7-4', gameId: 'g7', playerId: 'p8', teamId: 'panthers', type: 'goal', count: 1, createdAt: '2025-01-22T20:15:00Z' },
      { id: 's7-5', gameId: 'g7', playerId: 'p7', teamId: 'eagles', type: 'assist', count: 2, createdAt: '2025-01-22T20:00:00Z' },
      { id: 's7-6', gameId: 'g7', playerId: 'p1', teamId: 'eagles', type: 'assist', count: 1, createdAt: '2025-01-22T20:05:00Z' },
      { id: 's7-7', gameId: 'g7', playerId: 'p2', teamId: 'panthers', type: 'assist', count: 1, createdAt: '2025-01-22T20:10:00Z' },
    ],
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-22T20:30:00Z'
  },
  {
    id: 'g8',
    weekNumber: 3,
    date: '2025-01-22',
    time: '7:30 PM',
    location: 'Field 1, Mandarin Park',
    homeTeamId: 'lions',
    awayTeamId: 'dolphins',
    homeScore: 2,
    awayScore: 2,
    status: 'completed',
    statistics: [
      { id: 's8-1', gameId: 'g8', playerId: 'p3', teamId: 'lions', type: 'goal', count: 2, createdAt: '2025-01-22T21:00:00Z' },
      { id: 's8-2', gameId: 'g8', playerId: 'p4', teamId: 'dolphins', type: 'goal', count: 1, createdAt: '2025-01-22T21:10:00Z' },
      { id: 's8-3', gameId: 'g8', playerId: 'p8', teamId: 'dolphins', type: 'goal', count: 1, createdAt: '2025-01-22T21:20:00Z' },
      { id: 's8-4', gameId: 'g8', playerId: 'p4', teamId: 'dolphins', type: 'save', count: 8, createdAt: '2025-01-22T21:30:00Z' },
    ],
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-22T21:45:00Z'
  },
  {
    id: 'g9',
    weekNumber: 3,
    date: '2025-01-24',
    time: '6:00 PM',
    location: 'Field 2, Mandarin Park',
    homeTeamId: 'knights',
    awayTeamId: 'warriors',
    homeScore: null,
    awayScore: null,
    status: 'scheduled',
    statistics: [],
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z'
  }
]

// Sample full season schedule
export const FULL_SEASON_GAMES: Game[] = [
  // Week 1
  {
    id: 'g1',
    weekNumber: 1,
    date: '2025-01-08',
    time: '6:00 PM',
    location: 'Field 3, Mandarin Park',
    homeTeamId: 'eagles',
    awayTeamId: 'lions',
    homeScore: 4,
    awayScore: 2,
    status: 'completed',
    statistics: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-08T20:15:00Z'
  },
  {
    id: 'g2',
    weekNumber: 1,
    date: '2025-01-08',
    time: '7:30 PM',
    location: 'Field 1, Mandarin Park',
    homeTeamId: 'panthers',
    awayTeamId: 'dolphins',
    homeScore: 3,
    awayScore: 3,
    status: 'completed',
    statistics: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-08T21:30:00Z'
  },
  {
    id: 'g3',
    weekNumber: 1,
    date: '2025-01-10',
    time: '6:00 PM',
    location: 'Field 2, Mandarin Park',
    homeTeamId: 'knights',
    awayTeamId: 'warriors',
    homeScore: 1,
    awayScore: 4,
    status: 'completed',
    statistics: [],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-10T20:00:00Z'
  },
  // Week 2
  {
    id: 'g4',
    weekNumber: 2,
    date: '2025-01-15',
    time: '6:00 PM',
    location: 'Field 3, Mandarin Park',
    homeTeamId: 'dolphins',
    awayTeamId: 'eagles',
    homeScore: 2,
    awayScore: 5,
    status: 'completed',
    statistics: [],
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-15T20:20:00Z'
  },
  {
    id: 'g5',
    weekNumber: 2,
    date: '2025-01-15',
    time: '7:30 PM',
    location: 'Field 1, Mandarin Park',
    homeTeamId: 'warriors',
    awayTeamId: 'panthers',
    homeScore: 3,
    awayScore: 2,
    status: 'completed',
    statistics: [],
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-15T21:35:00Z'
  },
  {
    id: 'g6',
    weekNumber: 2,
    date: '2025-01-17',
    time: '6:00 PM',
    location: 'Field 2, Mandarin Park',
    homeTeamId: 'lions',
    awayTeamId: 'knights',
    homeScore: 4,
    awayScore: 1,
    status: 'completed',
    statistics: [],
    createdAt: '2025-01-08T00:00:00Z',
    updatedAt: '2025-01-17T20:10:00Z'
  },
  // Week 3 (Current week - include CURRENT_WEEK_GAMES)
  ...CURRENT_WEEK_GAMES
]

// Sample statistics for completed games
export const SAMPLE_STATISTICS: GameStatistic[] = [
  // Game 1 stats (Eagles 4 - Lions 2)
  { id: 's1', gameId: 'g1', playerId: 'p1', teamId: 'eagles', type: 'goal', count: 2, createdAt: '2025-01-08T20:00:00Z' },
  { id: 's2', gameId: 'g1', playerId: 'p7', teamId: 'eagles', type: 'goal', count: 2, createdAt: '2025-01-08T20:10:00Z' },
  { id: 's3', gameId: 'g1', playerId: 'p3', teamId: 'lions', type: 'goal', count: 2, createdAt: '2025-01-08T20:05:00Z' },
  { id: 's4', gameId: 'g1', playerId: 'p1', teamId: 'eagles', type: 'assist', count: 1, createdAt: '2025-01-08T20:10:00Z' },
  
  // Game 7 stats (Eagles 5 - Panthers 3)
  { id: 's5', gameId: 'g7', playerId: 'p1', teamId: 'eagles', type: 'goal', count: 3, createdAt: '2025-01-22T20:00:00Z' },
  { id: 's6', gameId: 'g7', playerId: 'p2', teamId: 'panthers', type: 'goal', count: 2, createdAt: '2025-01-22T20:15:00Z' },
  { id: 's7', gameId: 'g7', playerId: 'p8', teamId: 'panthers', type: 'goal', count: 1, createdAt: '2025-01-22T20:20:00Z' },
  { id: 's8', gameId: 'g7', playerId: 'p7', teamId: 'eagles', type: 'assist', count: 2, createdAt: '2025-01-22T20:10:00Z' },
  { id: 's9', gameId: 'g7', playerId: 'p4', teamId: 'dolphins', type: 'save', count: 8, createdAt: '2025-01-22T20:25:00Z' },
]

// Statistical leaders (top 5 for each category)
export const GOALS_LEADERS = [
  { player: SAMPLE_PLAYERS[0], count: 7 }, // Omar Helmy - 7 goals
  { player: SAMPLE_PLAYERS[1], count: 5 }, // Ahmed Hassan - 5 goals
  { player: SAMPLE_PLAYERS[2], count: 4 }, // Rafe Mohammad - 4 goals
  { player: SAMPLE_PLAYERS[4], count: 3 }, // Yusuf Ali - 3 goals
  { player: SAMPLE_PLAYERS[7], count: 3 }, // Hamza Mahmoud - 3 goals (tied)
]

export const ASSISTS_LEADERS = [
  { player: SAMPLE_PLAYERS[6], count: 4 }, // Bilal Sheikh - 4 assists
  { player: SAMPLE_PLAYERS[0], count: 3 }, // Omar Helmy - 3 assists
  { player: SAMPLE_PLAYERS[1], count: 2 }, // Ahmed Hassan - 2 assists
  { player: SAMPLE_PLAYERS[2], count: 2 }, // Rafe Mohammad - 2 assists (tied)
  { player: SAMPLE_PLAYERS[4], count: 1 }, // Yusuf Ali - 1 assist
]

export const SAVES_LEADERS = [
  { player: SAMPLE_PLAYERS[3], count: 15 }, // Adam Abu Maali (Dolphins GK) - 15 saves
  { player: SAMPLE_PLAYERS[5], count: 12 }, // Kareem Abdullah (Warriors GK) - 12 saves
  { player: { id: 'p9', name: 'Ibrahim Zaki', teamId: 'eagles' }, count: 10 },
  { player: { id: 'p10', name: 'Tariq Nasser', teamId: 'panthers' }, count: 9 },
  { player: { id: 'p11', name: 'Faisal Rahman', teamId: 'lions' }, count: 8 },
]

