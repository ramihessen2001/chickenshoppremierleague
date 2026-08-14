/**
 * Data access for the browser.
 *
 * Reads go straight to Supabase with the anon key (RLS allows SELECT).
 * Writes go through /api/admin/* routes, which verify the admin session cookie
 * server-side and use the service role key there. Nothing in this file can
 * write to the database on its own -- that is the point.
 */

import {
  supabase,
  Team,
  Player as SupabasePlayer,
  LeagueConfig,
  LeaguePhase,
  Signup,
} from './supabase'
import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { GameStatistic as LocalGameStatistic, StatType } from '@/types/statistic'

/* -------------------------------------------------------------------------- */
/* Shared query fragments                                                      */
/* -------------------------------------------------------------------------- */

const GAME_SELECT = `
  *,
  home_team:teams!home_team_id(id, name, slug, logo_url),
  away_team:teams!away_team_id(id, name, slug, logo_url),
  player_of_game:players!player_of_game_id(
    id, name, jersey_number, position, is_active, created_at, updated_at,
    team:teams(id, name, slug)
  )
`

const GAME_SELECT_WITH_STATS = `
  ${GAME_SELECT},
  statistics:game_statistics(
    *,
    player:players(id, name, jersey_number),
    team:teams(id, name, slug)
  )
`

/* -------------------------------------------------------------------------- */
/* Transforms                                                                  */
/* -------------------------------------------------------------------------- */

/** Supabase joins return either an object or a single-element array. */
function one<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) return value[0]
  return value ?? undefined
}

function transformStatistic(raw: any): LocalGameStatistic {
  const player = one<any>(raw.player)
  const team = one<any>(raw.team)
  return {
    id: raw.id,
    gameId: raw.game_id,
    playerId: raw.player_id,
    playerName: player?.name,
    jerseyNumber: player?.jersey_number,
    teamId: team?.slug || raw.team_id,
    type: raw.stat_type,
    count: raw.count,
    timestamp: raw.timestamp,
    createdAt: raw.created_at,
  }
}

/**
 * Converts a database game row into the shape the components use.
 *
 * Teams are exposed by slug (what the UI works in) but the UUIDs are kept
 * alongside, because writes need them.
 */
function transformGame(raw: any): Game {
  const homeTeam = one<any>(raw.home_team)
  const awayTeam = one<any>(raw.away_team)
  const potm = one<any>(raw.player_of_game)

  return {
    id: raw.id,
    gameNumber: raw.game_number,
    weekNumber: raw.week_number ?? 0,
    date: raw.date,
    time: raw.time,
    location: raw.location,
    homeTeamId: homeTeam?.slug || '',
    awayTeamId: awayTeam?.slug || '',
    homeTeamUUID: homeTeam?.id,
    awayTeamUUID: awayTeam?.id,
    homeScore: raw.home_score,
    awayScore: raw.away_score,
    status: raw.status,
    isPlayoff: raw.is_playoff ?? false,
    playoffRound: raw.playoff_round ?? null,
    streamUrl: raw.stream_url ?? null,
    statistics: (raw.statistics ?? []).map(transformStatistic),
    playerOfGameId: raw.player_of_game_id,
    playerOfGame: potm
      ? {
          id: potm.id,
          name: potm.name,
          jerseyNumber: potm.jersey_number,
          teamId: one<any>(potm.team)?.slug || '',
          position: potm.position,
          isActive: potm.is_active,
          createdAt: potm.created_at,
          updatedAt: potm.updated_at,
        }
      : null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

export async function getLeagueConfig(): Promise<LeagueConfig | null> {
  const { data, error } = await supabase
    .from('league_config')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching league config:', error)
    return null
  }
  return data
}

export async function getCurrentWeek(): Promise<number> {
  const config = await getLeagueConfig()
  return config?.current_week ?? 1
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('display_order')
    .order('name')

  if (error) {
    console.error('Error fetching teams:', error)
    return []
  }
  return data ?? []
}

export async function getTeamsWithPlayers(): Promise<
  (Team & { players: SupabasePlayer[] })[]
> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, players(*)')
    .order('display_order')
    .order('name')

  if (error) {
    console.error('Error fetching teams with players:', error)
    return []
  }
  return data ?? []
}

export async function getTeamBySlug(
  slug: string
): Promise<(Team & { players: SupabasePlayer[] }) | null> {
  const { data, error } = await supabase
    .from('teams')
    .select('*, players(*)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching team ${slug}:`, error)
    return null
  }
  return data
}

/**
 * Games for a single week. Week 0 holds playoff games.
 */
export async function getGamesByWeek(weekNumber: number): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT_WITH_STATS)
    .eq('week_number', weekNumber)
    .order('date')
    .order('time')

  if (error) {
    console.error(`Error fetching games for week ${weekNumber}:`, error)
    return []
  }
  return (data ?? []).map(transformGame)
}

export async function getAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT_WITH_STATS)
    .order('game_number')

  if (error) {
    console.error('Error fetching all games:', error)
    return []
  }
  return (data ?? []).map(transformGame)
}

/** How many games exist at all. Used to decide whether to link to the schedule. */
export async function countGames(): Promise<number> {
  const { count, error } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error counting games:', error)
    return 0
  }
  return count ?? 0
}

/** All playoff games, i.e. week 0. */
export async function getPlayoffGames(): Promise<Game[]> {
  return getGamesByWeek(0)
}

export async function getGameById(gameId: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT_WITH_STATS)
    .eq('id', gameId)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching game ${gameId}:`, error)
    return null
  }
  return data ? transformGame(data) : null
}

/**
 * All active players, keyed for UI use (team slug) but carrying the team UUID
 * for any code that still needs it.
 */
export async function getAllPlayers(): Promise<(Player & { teamUUID?: string })[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*, team:teams(id, name, slug)')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('Error fetching players:', error)
    return []
  }

  return (data ?? []).map((player: any) => {
    const team = one<any>(player.team)
    return {
      id: player.id,
      name: player.name,
      jerseyNumber: player.jersey_number,
      teamId: team?.slug || player.team_id,
      teamUUID: team?.id || player.team_id,
      isActive: player.is_active,
      position: player.position,
      createdAt: player.created_at,
      updatedAt: player.updated_at,
    }
  })
}

/**
 * Top N players for a statistic, summed across all games.
 */
export async function getStatLeaders(
  statType: 'goal' | 'assist' | 'save',
  limit = 5
) {
  const { data, error } = await supabase
    .from('game_statistics')
    .select('player_id, count, player:players(id, name, jersey_number, team_id)')
    .eq('stat_type', statType)

  if (error) {
    console.error(`Error fetching ${statType} leaders:`, error)
    return []
  }

  const totals = new Map<string, { player: any; count: number }>()

  for (const stat of data ?? []) {
    const player = one<any>((stat as any).player)
    const playerId = (stat as any).player_id
    const amount = (stat as any).count || 1
    const existing = totals.get(playerId)

    if (existing) {
      existing.count += amount
    } else {
      totals.set(playerId, {
        player: {
          id: player?.id || playerId,
          name: player?.name || 'Unknown',
          teamId: player?.team_id || '',
        },
        count: amount,
      })
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/**
 * Every player with their season totals.
 */
export async function getAllPlayersWithStats() {
  const [{ data: players, error: playersError }, { data: statistics, error: statsError }] =
    await Promise.all([
      supabase
        .from('players')
        .select('id, name, jersey_number, position, team:teams(id, name, slug, logo_url)')
        .eq('is_active', true)
        .order('name'),
      supabase.from('game_statistics').select('game_id, player_id, stat_type, count'),
    ])

  if (playersError) {
    console.error('Error fetching players:', playersError)
    return []
  }
  if (statsError) {
    console.error('Error fetching statistics:', statsError)
    return []
  }

  const { data: motmGames } = await supabase
    .from('games')
    .select('player_of_game_id')
    .not('player_of_game_id', 'is', null)

  const motmCount = new Map<string, number>()
  for (const game of motmGames ?? []) {
    const id = (game as any).player_of_game_id
    if (id) motmCount.set(id, (motmCount.get(id) ?? 0) + 1)
  }

  const byPlayer = new Map<string, any>()
  for (const player of (players ?? []) as any[]) {
    const team = one<any>(player.team)
    byPlayer.set(player.id, {
      id: player.id,
      name: player.name,
      jerseyNumber: player.jersey_number,
      position: player.position,
      team: team
        ? { id: team.id, name: team.name, slug: team.slug, logoUrl: team.logo_url }
        : null,
      goals: 0,
      assists: 0,
      saves: 0,
      gamesPlayed: 0,
      manOfTheMatchCount: motmCount.get(player.id) ?? 0,
    })
  }

  // Games played is the number of distinct games a player recorded a stat in.
  // A player who appeared but recorded nothing will not be counted -- the data
  // model has no appearance record to count instead.
  const gamesByPlayer = new Map<string, Set<string>>()

  for (const stat of (statistics ?? []) as any[]) {
    const player = byPlayer.get(stat.player_id)
    if (!player) continue

    const amount = stat.count || 1
    if (stat.stat_type === 'goal') player.goals += amount
    else if (stat.stat_type === 'assist') player.assists += amount
    else if (stat.stat_type === 'save') player.saves += amount

    if (!gamesByPlayer.has(stat.player_id)) {
      gamesByPlayer.set(stat.player_id, new Set())
    }
    gamesByPlayer.get(stat.player_id)!.add(stat.game_id)
  }

  for (const [playerId, player] of byPlayer) {
    player.gamesPlayed = gamesByPlayer.get(playerId)?.size ?? 0
  }

  return Array.from(byPlayer.values())
}

/* -------------------------------------------------------------------------- */
/* Writes -- all routed through the server                                     */
/* -------------------------------------------------------------------------- */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Calls an admin API route and throws an ApiError carrying the server's message
 * so callers can surface something useful instead of a bare "failed".
 */
async function apiRequest<T = unknown>(
  path: string,
  options: { method: string; body?: unknown; formData?: FormData }
): Promise<T> {
  const init: RequestInit = { method: options.method }

  if (options.formData) {
    init.body = options.formData
  } else if (options.body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(options.body)
  }

  const response = await fetch(path, init)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Your admin session has expired. Please log in again.'
        : payload.error || `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

/** Tells every mounted component to re-read its data. */
export function notifyDataUpdated() {
  window.dispatchEvent(new Event('dataUpdated'))
}

export interface GameWriteFields {
  streamUrl?: string | null
  weekNumber?: number | null
  date?: string
  time?: string
  location?: string
  /** Team UUIDs, not slugs. */
  homeTeamId?: string | null
  awayTeamId?: string | null
  homeScore?: number | null
  awayScore?: number | null
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed'
  isPlayoff?: boolean
  playoffRound?: string | null
  playerOfGameId?: string | null
}

export async function createGame(fields: GameWriteFields): Promise<string> {
  const { id } = await apiRequest<{ id: string }>('/api/admin/games', {
    method: 'POST',
    body: fields,
  })
  return id
}

export async function updateGame(gameId: string, fields: GameWriteFields): Promise<void> {
  await apiRequest(`/api/admin/games/${gameId}`, { method: 'PATCH', body: fields })
}

export async function deleteGame(gameId: string): Promise<void> {
  await apiRequest(`/api/admin/games/${gameId}`, { method: 'DELETE' })
}

export async function updateGameScores(
  gameId: string,
  homeScore: number,
  awayScore: number,
  status: GameWriteFields['status'] = 'completed'
): Promise<void> {
  await updateGame(gameId, { homeScore, awayScore, status })
}

export async function setPlayerOfGame(
  gameId: string,
  playerId: string | null
): Promise<void> {
  await updateGame(gameId, { playerOfGameId: playerId })
}

export interface BoxScoreStat {
  playerId: string
  type: StatType
  count?: number
}

/**
 * Saves a game's scores, statistics and man of the match in one request.
 * The statistics array replaces whatever the game currently has.
 */
export async function saveBoxScore(
  gameId: string,
  input: {
    homeScore: number | null
    awayScore: number | null
    status?: GameWriteFields['status']
    playerOfGameId?: string | null
    statistics: BoxScoreStat[]
  }
): Promise<void> {
  await apiRequest(`/api/admin/games/${gameId}/box-score`, {
    method: 'PUT',
    body: input,
  })
}

export interface PlayerWriteFields {
  name?: string
  /** Null means the player has no shirt number yet (shown as TBD). */
  jerseyNumber?: number | null
  /** Team UUID, not slug. */
  teamId?: string
  position?: string | null
  isActive?: boolean
}

export async function createPlayer(fields: PlayerWriteFields): Promise<string> {
  const { id } = await apiRequest<{ id: string }>('/api/admin/players', {
    method: 'POST',
    body: fields,
  })
  return id
}

export async function updatePlayer(
  playerId: string,
  fields: PlayerWriteFields
): Promise<void> {
  await apiRequest(`/api/admin/players/${playerId}`, { method: 'PATCH', body: fields })
}

export async function deletePlayer(playerId: string): Promise<void> {
  await apiRequest(`/api/admin/players/${playerId}`, { method: 'DELETE' })
}

export interface LeagueConfigWriteFields {
  currentWeek?: number
  totalWeeks?: number
  season?: string
  leagueName?: string
  startDate?: string
  endDate?: string
  phase?: LeaguePhase
  standingsImageUrl?: string | null
}

export async function updateLeagueConfig(
  fields: LeagueConfigWriteFields
): Promise<LeagueConfig> {
  const { config } = await apiRequest<{ config: LeagueConfig }>(
    '/api/admin/league-config',
    { method: 'PATCH', body: fields }
  )
  return config
}

export async function uploadStandingsImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { url } = await apiRequest<{ url: string }>('/api/admin/standings', {
    method: 'POST',
    formData,
  })
  return url
}

/* -------------------------------------------------------------------------- */
/* Signups                                                                     */
/* -------------------------------------------------------------------------- */

export interface SignupInput {
  name: string
  email: string
  age: number
  phone?: string
  position?: string
  experience?: string
  notes?: string
}

/**
 * Registers a player. Public -- no admin session needed.
 * Resolves to null on success, or a message to show the person signing up.
 */
export async function submitSignup(input: SignupInput): Promise<string | null> {
  try {
    const response = await fetch('/api/signups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (response.ok) return null

    const payload = await response.json().catch(() => ({}))
    return payload.error || 'Could not complete your registration'
  } catch {
    return 'Could not reach the server. Check your connection and try again.'
  }
}

/** A signup row with its drafted team joined in. */
export type SignupWithTeam = Signup & {
  drafted_team?: { id: string; name: string; slug: string } | null
}

/** The full signup list. Admin only. */
export async function getSignups(): Promise<SignupWithTeam[]> {
  const { signups } = await apiRequest<{ signups: SignupWithTeam[] }>(
    '/api/admin/signups',
    { method: 'GET' }
  )
  return signups
}

export interface SignupWriteFields {
  name?: string
  email?: string
  phone?: string | null
  position?: string | null
  experience?: string | null
  notes?: string | null
  status?: Signup['status']
  /** Team UUID. */
  draftedTeamId?: string | null
  /** Also create a player row on the drafted team. */
  createPlayer?: boolean
}

export async function updateSignup(
  signupId: string,
  fields: SignupWriteFields
): Promise<SignupWithTeam> {
  const { signup } = await apiRequest<{ signup: SignupWithTeam }>(
    `/api/admin/signups/${signupId}`,
    { method: 'PATCH', body: fields }
  )
  return signup
}

export async function deleteSignup(signupId: string): Promise<void> {
  await apiRequest(`/api/admin/signups/${signupId}`, { method: 'DELETE' })
}
