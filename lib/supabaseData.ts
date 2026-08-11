/**
 * Supabase Data Fetching Utilities
 * 
 * Helper functions for fetching data from the Supabase database.
 * All functions handle errors gracefully and return null/empty arrays on failure.
 */

import { supabase, supabaseAdmin, Team, Player as SupabasePlayer, Game as SupabaseGame, GameStatistic, LeagueConfig } from './supabase'
import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { GameStatistic as LocalGameStatistic } from '@/types/statistic'

/**
 * Fetch league configuration
 */
export async function getLeagueConfig(): Promise<LeagueConfig | null> {
  const { data, error } = await supabase
    .from('league_config')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching league config:', error)
    return null
  }

  return data
}

/**
 * Fetch all teams with their players
 */
export async function getTeamsWithPlayers(): Promise<(Team & { players: SupabasePlayer[] })[]> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      players (*)
    `)
    .order('name')

  if (error) {
    console.error('Error fetching teams with players:', error)
    return []
  }

  return data || []
}

/**
 * Fetch a single team by slug
 */
export async function getTeamBySlug(slug: string): Promise<(Team & { players: SupabasePlayer[] }) | null> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      players (*)
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error(`Error fetching team ${slug}:`, error)
    return null
  }

  return data
}

/**
 * Transform Supabase game to local Game type
 * Converts UUID team IDs to slug-based IDs for compatibility with existing components
 * Also stores original UUID team IDs for saving statistics
 */
function transformGame(supabaseGame: any): Game & { homeTeamUUID?: string; awayTeamUUID?: string } {
  return {
    id: supabaseGame.id,
    weekNumber: supabaseGame.week_number || 0,
    date: supabaseGame.date,
    time: supabaseGame.time,
    location: supabaseGame.location,
    homeTeamId: supabaseGame.home_team?.slug || '',
    awayTeamId: supabaseGame.away_team?.slug || '',
    homeTeamUUID: supabaseGame.home_team?.id, // Store UUID for saving
    awayTeamUUID: supabaseGame.away_team?.id, // Store UUID for saving
    homeScore: supabaseGame.home_score,
    awayScore: supabaseGame.away_score,
    status: supabaseGame.status,
    statistics: supabaseGame.statistics?.map((stat: any) => transformStatistic(stat)) || [],
    playerOfGameId: supabaseGame.player_of_game_id,
    playerOfGame: supabaseGame.player_of_game ? {
      id: supabaseGame.player_of_game.id,
      name: supabaseGame.player_of_game.name,
      jerseyNumber: supabaseGame.player_of_game.jersey_number,
      teamId: supabaseGame.player_of_game.team?.slug || '',
      position: supabaseGame.player_of_game.position,
      isActive: supabaseGame.player_of_game.is_active,
      createdAt: supabaseGame.player_of_game.created_at,
      updatedAt: supabaseGame.player_of_game.updated_at
    } : null,
    createdAt: supabaseGame.created_at,
    updatedAt: supabaseGame.updated_at
  }
}

/**
 * Transform Supabase statistic to local GameStatistic type
 */
function transformStatistic(supabaseStat: any): LocalGameStatistic {
  return {
    id: supabaseStat.id,
    gameId: supabaseStat.game_id,
    playerId: supabaseStat.player_id,
    playerName: supabaseStat.player?.name, // Include player name for display
    jerseyNumber: supabaseStat.player?.jersey_number, // Include jersey number for display
    teamId: supabaseStat.team?.slug || supabaseStat.team_id, // Use team slug for filtering
    type: supabaseStat.stat_type,
    count: supabaseStat.count,
    timestamp: supabaseStat.timestamp,
    createdAt: supabaseStat.created_at
  }
}

/**
 * Fetch games for a specific week with team info
 */
export async function getGamesByWeek(weekNumber: number): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(id, name, slug, logo_url),
      away_team:teams!away_team_id(id, name, slug, logo_url)
    `)
    .eq('week_number', weekNumber)
    .order('date')
    .order('time')

  if (error) {
    console.error(`Error fetching games for week ${weekNumber}:`, error)
    return []
  }

  // For each game, fetch the player of game if it exists
  const gamesWithPlayerOfGame = await Promise.all(
    (data || []).map(async (game) => {
      if (game.player_of_game_id) {
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select(`
            id,
            name,
            jersey_number,
            position,
            is_active,
            created_at,
            updated_at,
            team:teams(id, name, slug)
          `)
          .eq('id', game.player_of_game_id)
          .single()

        if (!playerError && player) {
          return { ...game, player_of_game: player }
        }
      }
      return game
    })
  )

  return gamesWithPlayerOfGame.map(transformGame)
}

/**
 * Fetch all games with team info
 */
export async function getAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(id, name, slug, logo_url),
      away_team:teams!away_team_id(id, name, slug, logo_url),
      statistics:game_statistics(
        *,
        player:players(id, name, jersey_number),
        team:teams(id, name, slug)
      )
    `)
    .order('game_number')

  if (error) {
    console.error('Error fetching all games:', error)
    return []
  }

  // For each game, fetch the player of game if it exists
  const gamesWithPlayerOfGame = await Promise.all(
    (data || []).map(async (game) => {
      if (game.player_of_game_id) {
        const { data: player, error: playerError } = await supabase
          .from('players')
          .select(`
            id,
            name,
            jersey_number,
            position,
            is_active,
            created_at,
            updated_at,
            team:teams(id, name, slug)
          `)
          .eq('id', game.player_of_game_id)
          .single()

        if (!playerError && player) {
          return { ...game, player_of_game: player }
        }
      }
      return game
    })
  )

  return gamesWithPlayerOfGame.map(transformGame)
}

/**
 * Fetch a single game by ID with statistics
 */
export async function getGameById(gameId: string): Promise<Game | null> {
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select(`
      *,
      home_team:teams!home_team_id(id, name, slug, logo_url),
      away_team:teams!away_team_id(id, name, slug, logo_url)
    `)
    .eq('id', gameId)
    .single()

  if (gameError) {
    console.error(`Error fetching game ${gameId}:`, gameError)
    return null
  }

  // Fetch statistics for this game
  const { data: statistics, error: statsError } = await supabase
    .from('game_statistics')
    .select(`
      *,
      player:players(id, name, jersey_number),
      team:teams(id, name, slug)
    `)
    .eq('game_id', gameId)

  if (statsError) {
    console.error(`Error fetching statistics for game ${gameId}:`, statsError)
  }

  // Fetch player of game if it exists
  let playerOfGame = null
  if (game.player_of_game_id) {
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select(`
        id,
        name,
        jersey_number,
        position,
        is_active,
        created_at,
        updated_at,
        team:teams(id, name, slug)
      `)
      .eq('id', game.player_of_game_id)
      .single()

    if (!playerError && player) {
      playerOfGame = player
    }
  }

  return transformGame({
    ...game,
    statistics: statistics || [],
    player_of_game: playerOfGame
  })
}

/**
 * Calculate top stat leaders
 * Returns data in the format expected by the StatLeaders component
 */
export async function getStatLeaders(statType: 'goal' | 'assist' | 'save', limit: number = 5) {
  // Use SQL aggregation to sum all counts for each player
  const { data, error } = await supabase
    .from('game_statistics')
    .select(`
      player_id,
      count,
      player:players(id, name, jersey_number, team_id)
    `)
    .eq('stat_type', statType)

  if (error) {
    console.error(`Error fetching ${statType} leaders:`, error)
    return []
  }

  // Aggregate by player (sum all counts for each player)
  const aggregated = new Map()
  data?.forEach((stat: any) => {
    const playerId = stat.player_id
    const player = Array.isArray(stat.player) ? stat.player[0] : stat.player
    if (aggregated.has(playerId)) {
      // Add the count from this statistic record
      aggregated.get(playerId).count += stat.count || 1
    } else {
      aggregated.set(playerId, {
        player: {
          id: player?.id || playerId,
          name: player?.name || 'Unknown',
          teamId: player?.team_id || ''
        },
        count: stat.count || 1
      })
    }
  })

  // Convert to array, sort by count descending, and take top N
  const leaders = Array.from(aggregated.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)

  return leaders
}

/**
 * Get all teams (simple list)
 */
export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching teams:', error)
    return []
  }

  return data || []
}

/**
 * Get all players across all teams
 * Returns players with team slug as teamId for compatibility with existing components
 * Also includes teamUUID for saving to database
 */
export async function getAllPlayers(): Promise<(Player & { teamUUID?: string })[]> {
  const { data, error } = await supabase
    .from('players')
    .select(`
      *,
      team:teams(id, name, slug)
    `)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching players:', error)
    return []
  }

  // Transform to use team slug as teamId for compatibility, but keep UUID for saving
  return (data || []).map(player => ({
    id: player.id,
    name: player.name,
    jerseyNumber: player.jersey_number,
    teamId: player.team?.slug || player.team_id, // Use slug for compatibility
    teamUUID: player.team?.id || player.team_id, // Keep UUID for saving
    isActive: player.is_active,
    position: player.position,
    createdAt: player.created_at,
    updatedAt: player.updated_at
  }))
}

/**
 * Get current week number based on league config
 */
export async function getCurrentWeek(): Promise<number> {
  const config = await getLeagueConfig()
  return config?.current_week || 1
}

/**
 * Update game scores
 * Uses admin client to bypass RLS
 */
export async function updateGameScores(
  gameId: string,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed' = 'completed'
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('games')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', gameId)

  if (error) {
    console.error('Error updating game scores:', error)
    return false
  }

  return true
}

/**
 * Update full game details (date, time, location, teams, status, scores)
 * Uses admin client to bypass RLS
 */
export async function updateGame(
  gameId: string,
  updates: {
    weekNumber?: number
    date?: string
    time?: string
    location?: string
    homeTeamId?: string // UUID
    awayTeamId?: string // UUID
    homeScore?: number | null
    awayScore?: number | null
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
  }
): Promise<boolean> {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.weekNumber !== undefined) updateData.week_number = updates.weekNumber
  if (updates.date !== undefined) updateData.date = updates.date
  if (updates.time !== undefined) updateData.time = updates.time
  if (updates.location !== undefined) updateData.location = updates.location
  if (updates.homeTeamId !== undefined) updateData.home_team_id = updates.homeTeamId
  if (updates.awayTeamId !== undefined) updateData.away_team_id = updates.awayTeamId
  if (updates.homeScore !== undefined) updateData.home_score = updates.homeScore
  if (updates.awayScore !== undefined) updateData.away_score = updates.awayScore
  if (updates.status !== undefined) updateData.status = updates.status

  const { error } = await supabaseAdmin
    .from('games')
    .update(updateData)
    .eq('id', gameId)

  if (error) {
    console.error('Error updating game:', error)
    return false
  }

  return true
}

/**
 * Create a new game
 * Uses admin client to bypass RLS
 */
export async function createGame(gameData: {
  gameNumber: number
  weekNumber: number
  date: string
  time: string
  location: string
  homeTeamId: string // UUID
  awayTeamId: string // UUID
  homeScore?: number | null
  awayScore?: number | null
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
}): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('games')
    .insert({
      game_number: gameData.gameNumber,
      week_number: gameData.weekNumber,
      date: gameData.date,
      time: gameData.time,
      location: gameData.location,
      home_team_id: gameData.homeTeamId,
      away_team_id: gameData.awayTeamId,
      home_score: gameData.homeScore ?? null,
      away_score: gameData.awayScore ?? null,
      status: gameData.status ?? 'scheduled',
      is_playoff: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating game:', error)
    return null
  }

  return data?.id || null
}

/**
 * Add game statistic
 * Uses admin client to bypass RLS
 * Note: Use deleteAllGameStatistics() before calling this to avoid duplicates
 */
export async function upsertGameStatistic(
  gameId: string,
  playerId: string,
  teamId: string,
  statType: 'goal' | 'assist' | 'save' | 'yellow_card' | 'red_card' | 'blue_card',
  count: number = 1
): Promise<boolean> {
  console.log('Inserting statistic:', { gameId, playerId, teamId, statType, count })
  
  const { data, error } = await supabaseAdmin
    .from('game_statistics')
    .insert({
      game_id: gameId,
      player_id: playerId,
      team_id: teamId,
      stat_type: statType,
      count: count,
      created_at: new Date().toISOString()
    })
    .select()

  if (error) {
    console.error('Error inserting game statistic:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    return false
  }

  console.log('Statistic inserted successfully:', data)
  return true
}

// Alias for backward compatibility
export const insertGameStatistic = upsertGameStatistic

/**
 * Delete game statistic
 * Uses admin client to bypass RLS
 */
export async function deleteGameStatistic(statisticId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('game_statistics')
    .delete()
    .eq('id', statisticId)

  if (error) {
    console.error('Error deleting game statistic:', error)
    return false
  }

  return true
}

/**
 * Delete all statistics for a game
 * Uses admin client to bypass RLS
 */
export async function deleteAllGameStatistics(gameId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('game_statistics')
    .delete()
    .eq('game_id', gameId)

  if (error) {
    console.error('Error deleting game statistics:', error)
    return false
  }

  return true
}

/**
 * Get all players with their aggregated statistics
 */
export async function getAllPlayersWithStats() {
  // Fetch all players with their team info
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select(`
      id,
      name,
      jersey_number,
      position,
      team:teams(id, name, slug, logo_url)
    `)
    .eq('is_active', true)
    .order('name')

  if (playersError) {
    console.error('Error fetching players:', playersError)
    return []
  }

  // Fetch all statistics
  const { data: statistics, error: statsError } = await supabase
    .from('game_statistics')
    .select('player_id, stat_type, count')

  if (statsError) {
    console.error('Error fetching statistics:', statsError)
    return []
  }

  // Fetch Man of The Match awards (count how many times each player was selected)
  const { data: motmGames, error: motmError } = await supabase
    .from('games')
    .select('player_of_game_id')
    .not('player_of_game_id', 'is', null)

  if (motmError) {
    console.error('Error fetching Man of The Match data:', motmError)
  }

  // Count Man of The Match awards per player
  const motmCount = new Map()
  motmGames?.forEach((game: any) => {
    if (game.player_of_game_id) {
      motmCount.set(
        game.player_of_game_id,
        (motmCount.get(game.player_of_game_id) || 0) + 1
      )
    }
  })

  // Aggregate stats for each player
  const playerStatsMap = new Map()

  players?.forEach((player: any) => {
    playerStatsMap.set(player.id, {
      id: player.id,
      name: player.name,
      jerseyNumber: player.jersey_number,
      position: player.position,
      team: player.team ? {
        id: player.team.id,
        name: player.team.name,
        slug: player.team.slug,
        logoUrl: player.team.logo_url
      } : null,
      goals: 0,
      assists: 0,
      saves: 0,
      gamesPlayed: 0,
      manOfTheMatchCount: motmCount.get(player.id) || 0
    })
  })

  // Aggregate statistics
  const gamesPerPlayer = new Map()
  
  statistics?.forEach((stat: any) => {
    const playerStats = playerStatsMap.get(stat.player_id)
    if (playerStats) {
      const count = stat.count || 1
      if (stat.stat_type === 'goal') {
        playerStats.goals += count
      } else if (stat.stat_type === 'assist') {
        playerStats.assists += count
      } else if (stat.stat_type === 'save') {
        playerStats.saves += count
      }

      // Track unique games played
      if (!gamesPerPlayer.has(stat.player_id)) {
        gamesPerPlayer.set(stat.player_id, new Set())
      }
    }
  })

  // Count games played for each player
  playerStatsMap.forEach((playerStats, playerId) => {
    const games = gamesPerPlayer.get(playerId)
    playerStats.gamesPlayed = games ? games.size : 0
  })

  return Array.from(playerStatsMap.values())
}

