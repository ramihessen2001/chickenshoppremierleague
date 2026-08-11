/**
 * Local data store for YM JAX Soccer League
 * localStorage-based data management for Phase 1 admin editing
 * Can be replaced with database in Phase 3
 */

'use client'

import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { GameStatistic } from '@/types/statistic'
import { 
  FULL_SEASON_GAMES, 
  SAMPLE_STATISTICS, 
  SAMPLE_PLAYERS,
  LEAGUE_CONFIG 
} from './sampleData'

const STORAGE_KEYS = {
  GAMES: 'ym_soccer_games',
  STATISTICS: 'ym_soccer_statistics',
  PLAYERS: 'ym_soccer_players',
  INITIALIZED: 'ym_soccer_initialized'
}

// Initialize localStorage with sample data on first load
export function initializeLocalStorage() {
  if (typeof window === 'undefined') return
  
  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED)
  if (!initialized) {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(FULL_SEASON_GAMES))
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(SAMPLE_STATISTICS))
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(SAMPLE_PLAYERS))
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true')
  }
}

// Games
export function getLocalGames(): Game[] {
  if (typeof window === 'undefined') return FULL_SEASON_GAMES
  
  const stored = localStorage.getItem(STORAGE_KEYS.GAMES)
  return stored ? JSON.parse(stored) : FULL_SEASON_GAMES
}

export function updateLocalGame(gameId: string, updates: Partial<Game>): boolean {
  try {
    const games = getLocalGames()
    const index = games.findIndex(g => g.id === gameId)
    
    if (index === -1) return false
    
    games[index] = { ...games[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
    return true
  } catch (error) {
    console.error('Error updating game:', error)
    return false
  }
}

export function addLocalGame(game: Game): boolean {
  try {
    const games = getLocalGames()
    games.push(game)
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
    return true
  } catch (error) {
    console.error('Error adding game:', error)
    return false
  }
}

export function deleteLocalGame(gameId: string): boolean {
  try {
    const games = getLocalGames().filter(g => g.id !== gameId)
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games))
    
    // Also delete associated statistics
    const stats = getLocalStatistics().filter(s => s.gameId !== gameId)
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(stats))
    return true
  } catch (error) {
    console.error('Error deleting game:', error)
    return false
  }
}

// Statistics
export function getLocalStatistics(): GameStatistic[] {
  if (typeof window === 'undefined') return SAMPLE_STATISTICS
  
  const stored = localStorage.getItem(STORAGE_KEYS.STATISTICS)
  return stored ? JSON.parse(stored) : SAMPLE_STATISTICS
}

export function updateGameStatistics(gameId: string, statistics: GameStatistic[]): boolean {
  try {
    const allStats = getLocalStatistics().filter(s => s.gameId !== gameId)
    const newStats = [...allStats, ...statistics]
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(newStats))
    return true
  } catch (error) {
    console.error('Error updating statistics:', error)
    return false
  }
}

// Players
export function getLocalPlayers(): Player[] {
  if (typeof window === 'undefined') return SAMPLE_PLAYERS
  
  const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS)
  return stored ? JSON.parse(stored) : SAMPLE_PLAYERS
}

export function addLocalPlayer(player: Player): boolean {
  try {
    const players = getLocalPlayers()
    players.push(player)
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))
    return true
  } catch (error) {
    console.error('Error adding player:', error)
    return false
  }
}

export function updateLocalPlayer(playerId: string, updates: Partial<Player>): boolean {
  try {
    const players = getLocalPlayers()
    const index = players.findIndex(p => p.id === playerId)
    
    if (index === -1) return false
    
    players[index] = { ...players[index], ...updates, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))
    return true
  } catch (error) {
    console.error('Error updating player:', error)
    return false
  }
}

export function deleteLocalPlayer(playerId: string): boolean {
  try {
    const players = getLocalPlayers().filter(p => p.id !== playerId)
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players))
    return true
  } catch (error) {
    console.error('Error deleting player:', error)
    return false
  }
}

// Get current week games (with local data)
export function getCurrentWeekGames(): Game[] {
  const games = getLocalGames()
  return games.filter(g => g.weekNumber === LEAGUE_CONFIG.currentWeek)
}

// Get game by ID (with local data and statistics)
export function getLocalGameById(gameId: string): Game | null {
  const games = getLocalGames()
  const game = games.find(g => g.id === gameId)
  
  if (!game) return null
  
  const statistics = getLocalStatistics().filter(s => s.gameId === gameId)
  return { ...game, statistics }
}




