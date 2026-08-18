/**
 * Data access for the browser.
 *
 * Reads go straight to Supabase with the anon key (RLS allows SELECT).
 * Writes go through /api/admin/* routes, which verify the admin session cookie
 * server-side and use the service role key there. Nothing in this file can
 * write to the database on its own -- that is the point.
 *
 * `getLeagueConfig`/`updateLeagueConfig` are the exception in local dev: see
 * `lib/devSandbox.ts` for why league_config writes are kept out of Supabase
 * entirely while running under `next dev`.
 */

import {
  supabase,
  Team,
  Player as SupabasePlayer,
  LeagueConfig,
  LeaguePhase,
  Signup,
  Question,
  QuestionStatus,
} from './supabase'
import {
  devSandboxActive,
  getSandboxConfig,
  setSandboxConfig,
  setSandboxDraftOrder,
  getSandboxGames,
  addSandboxGame,
  updateSandboxGame,
  deleteSandboxGame,
  isSandboxGameId,
  SANDBOX_GAME_PREFIX,
} from './devSandbox'
import { Game } from '@/types/game'
import { Player } from '@/types/player'
import {
  GameStatistic as LocalGameStatistic,
  StatType,
  LeaderboardEntry,
} from '@/types/statistic'
import { Standing, StandingWriteFields } from '@/types/standing'
import { CommissionerPost, CommissionerPostWriteFields } from '@/types/commissionerPost'
import { ArchiveSeason, ArchiveStanding, ArchiveGame } from '@/types/archive'
import { calculatePoints, rankStandings } from './standings'

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
  // Layer local-only overrides (phase, current week, ...) on top of the real
  // row, so a dev-mode phase change is visible here without ever touching
  // Supabase. No-ops outside `next dev`.
  return data && devSandboxActive ? { ...data, ...getSandboxConfig() } : data
}

export async function getCurrentWeek(): Promise<number> {
  const config = await getLeagueConfig()
  return config?.current_week ?? 1
}

/**
 * The league table, ranked (points, then goal difference, then goals for).
 *
 * Joined from `teams` rather than `standings` so a team with no standings row
 * yet (freshly added, before the migration backfill reaches it) still shows
 * up, at 0-0-0-0.
 */
export async function getStandings(): Promise<Standing[]> {
  const { data, error } = await supabase.from('teams').select(`
    id, name, slug, logo_url,
    standings(games_played, wins, draws, losses, goals_for, goals_against)
  `)

  if (error) {
    console.error('Error fetching standings:', error)
    return []
  }

  const rows: Standing[] = (data ?? []).map((team: any) => {
    const row = one<any>(team.standings)
    const wins = row?.wins ?? 0
    const draws = row?.draws ?? 0
    const goalsFor = row?.goals_for ?? 0
    const goalsAgainst = row?.goals_against ?? 0

    return {
      teamId: team.id,
      teamName: team.name,
      teamSlug: team.slug,
      logoUrl: team.logo_url,
      gamesPlayed: row?.games_played ?? 0,
      wins,
      draws,
      losses: row?.losses ?? 0,
      goalsFor,
      goalsAgainst,
      goalDifference: goalsFor - goalsAgainst,
      points: calculatePoints(wins, draws),
    }
  })

  return rankStandings(rows)
}

export async function updateStanding(
  teamId: string,
  fields: StandingWriteFields
): Promise<void> {
  await apiRequest(`/api/admin/standings/${teamId}`, { method: 'PATCH', body: fields })
}

/* -------------------------------------------------------------------------- */
/* Season archive -- read-only snapshots written by "archive & reset season"   */
/* -------------------------------------------------------------------------- */

export async function getArchiveSeasons(): Promise<ArchiveSeason[]> {
  const { data, error } = await supabase
    .from('archive_seasons')
    .select('*')
    .order('archived_at', { ascending: false })

  if (error) {
    console.error('Error fetching archived seasons:', error)
    return []
  }
  return (data ?? []).map((row: any) => ({
    id: row.id,
    label: row.label,
    archivedAt: row.archived_at,
  }))
}

/** The most recently archived season, or null if nothing has been archived yet. */
export async function getLatestArchiveSeason(): Promise<ArchiveSeason | null> {
  const seasons = await getArchiveSeasons()
  return seasons[0] ?? null
}

export async function getArchiveStandings(archiveSeasonId: string): Promise<ArchiveStanding[]> {
  const { data, error } = await supabase
    .from('archive_standings')
    .select('*, team:archive_teams(id, name, slug, logo_url)')
    .eq('archive_season_id', archiveSeasonId)

  if (error) {
    console.error('Error fetching archived standings:', error)
    return []
  }

  const rows: ArchiveStanding[] = (data ?? [])
    .map((row: any) => {
      const team = one<any>(row.team)
      if (!team) return null
      const goalsFor = row.goals_for ?? 0
      const goalsAgainst = row.goals_against ?? 0
      const wins = row.wins ?? 0
      const draws = row.draws ?? 0
      return {
        teamId: team.id,
        teamName: team.name,
        teamSlug: team.slug,
        logoUrl: team.logo_url,
        gamesPlayed: row.games_played ?? 0,
        wins,
        draws,
        losses: row.losses ?? 0,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        points: calculatePoints(wins, draws),
      }
    })
    .filter((row): row is ArchiveStanding => row !== null)

  return rankStandings(rows)
}

export async function getArchiveGames(archiveSeasonId: string): Promise<ArchiveGame[]> {
  const { data, error } = await supabase
    .from('archive_games')
    .select(
      '*, home_team:archive_teams!home_archive_team_id(name, slug), away_team:archive_teams!away_archive_team_id(name, slug)'
    )
    .eq('archive_season_id', archiveSeasonId)
    .order('date')
    .order('time')

  if (error) {
    console.error('Error fetching archived games:', error)
    return []
  }

  return (data ?? []).map((row: any) => {
    const homeTeam = one<any>(row.home_team)
    const awayTeam = one<any>(row.away_team)
    return {
      id: row.id,
      gameNumber: row.game_number,
      weekNumber: row.week_number,
      date: row.date,
      time: row.time,
      location: row.location,
      homeTeamName: homeTeam?.name ?? 'TBD',
      awayTeamName: awayTeam?.name ?? 'TBD',
      homeTeamSlug: homeTeam?.slug ?? null,
      awayTeamSlug: awayTeam?.slug ?? null,
      homeScore: row.home_score,
      awayScore: row.away_score,
      status: row.status,
      isPlayoff: row.is_playoff ?? false,
      playoffRound: row.playoff_round,
    }
  })
}

/**
 * Two reads rather than one PostgREST call with a nested filter --
 * archive_game_statistics has no archive_season_id of its own, and filtering
 * through an embedded resource is fussy to get right. This is simple to
 * reason about instead: get this season's player ids, then their stats.
 */
export async function getArchiveStatLeaders(
  archiveSeasonId: string,
  statType: 'goal' | 'assist' | 'save',
  limit = 5
): Promise<LeaderboardEntry[]> {
  const { data: players, error: playersError } = await supabase
    .from('archive_players')
    .select('id, name, archive_team_id')
    .eq('archive_season_id', archiveSeasonId)

  if (playersError) {
    console.error('Error fetching archived players:', playersError)
    return []
  }
  if (!players || players.length === 0) return []

  const playerIds = players.map((p: any) => p.id)
  const { data: stats, error: statsError } = await supabase
    .from('archive_game_statistics')
    .select('archive_player_id, count')
    .eq('stat_type', statType)
    .in('archive_player_id', playerIds)

  if (statsError) {
    console.error(`Error fetching archived ${statType} leaders:`, statsError)
    return []
  }

  const playerById = new Map(players.map((p: any) => [p.id, p]))
  const totals = new Map<string, number>()
  for (const stat of stats ?? []) {
    const amount = (stat as any).count || 1
    const playerId = (stat as any).archive_player_id
    totals.set(playerId, (totals.get(playerId) ?? 0) + amount)
  }

  return Array.from(totals.entries())
    .map(([playerId, count]) => {
      const player = playerById.get(playerId) as any
      return {
        player: {
          id: playerId,
          name: player?.name ?? 'Unknown',
          teamId: player?.archive_team_id ?? '',
        },
        count,
      }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
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

/** Date-then-time comparator matching the `.order('date').order('time')` read below. */
function byDateThenTime(a: Game, b: Game): number {
  return a.date.localeCompare(b.date) || a.time.localeCompare(b.time)
}

/**
 * Games for a single week. Week 0 holds playoff games.
 *
 * Layers in any games created locally (see lib/devSandbox.ts) while running
 * under `next dev`, so the schedule and bracket generators are fully
 * testable without a single game reaching Supabase.
 */
export async function getGamesByWeek(weekNumber: number): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT_WITH_STATS)
    .eq('week_number', weekNumber)
    .order('date')
    .order('time')

  const real = error ? [] : (data ?? []).map(transformGame)
  if (error) console.error(`Error fetching games for week ${weekNumber}:`, error)
  if (!devSandboxActive) return real

  const sandboxed = getSandboxGames().filter((g) => g.weekNumber === weekNumber)
  return [...real, ...sandboxed].sort(byDateThenTime)
}

export async function getAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT_WITH_STATS)
    .order('game_number')

  const real = error ? [] : (data ?? []).map(transformGame)
  if (error) console.error('Error fetching all games:', error)
  if (!devSandboxActive) return real

  return [...real, ...getSandboxGames()]
}

/** How many games exist at all. Used to decide whether to link to the schedule. */
export async function countGames(): Promise<number> {
  const { count, error } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })

  const real = error ? 0 : (count ?? 0)
  if (error) console.error('Error counting games:', error)
  return devSandboxActive ? real + getSandboxGames().length : real
}

/** All playoff games, i.e. week 0. */
export async function getPlayoffGames(): Promise<Game[]> {
  return getGamesByWeek(0)
}

export async function getGameById(gameId: string): Promise<Game | null> {
  if (devSandboxActive && isSandboxGameId(gameId)) {
    return getSandboxGames().find((g) => g.id === gameId) ?? null
  }

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

/** A team's slug and name from its UUID. Read-only, so safe even in the sandbox. */
async function resolveTeam(
  teamId: string | null | undefined
): Promise<{ slug: string; name: string } | null> {
  if (!teamId) return null
  const { data } = await supabase.from('teams').select('slug, name').eq('id', teamId).maybeSingle()
  return data
}

export async function createGame(fields: GameWriteFields): Promise<string> {
  if (devSandboxActive) {
    // Kept out of Supabase entirely in dev -- see lib/devSandbox.ts.
    const [homeTeam, awayTeam] = await Promise.all([
      resolveTeam(fields.homeTeamId),
      resolveTeam(fields.awayTeamId),
    ])
    const id = `${SANDBOX_GAME_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2)}`
    const now = new Date().toISOString()
    const isPlayoff = fields.isPlayoff ?? false

    addSandboxGame({
      id,
      weekNumber: isPlayoff ? 0 : (fields.weekNumber ?? 1),
      date: fields.date ?? '',
      time: fields.time ?? '',
      location: fields.location ?? 'TBD',
      homeTeamId: homeTeam?.slug ?? '',
      awayTeamId: awayTeam?.slug ?? '',
      homeTeamUUID: fields.homeTeamId ?? undefined,
      awayTeamUUID: fields.awayTeamId ?? undefined,
      homeScore: fields.homeScore ?? null,
      awayScore: fields.awayScore ?? null,
      status: fields.status ?? 'scheduled',
      isPlayoff,
      playoffRound: isPlayoff ? (fields.playoffRound ?? null) : null,
      streamUrl: fields.streamUrl ?? null,
      statistics: [],
      playerOfGameId: null,
      playerOfGame: null,
      createdAt: now,
      updatedAt: now,
    })
    return id
  }

  const { id } = await apiRequest<{ id: string }>('/api/admin/games', {
    method: 'POST',
    body: fields,
  })
  return id
}

export async function updateGame(gameId: string, fields: GameWriteFields): Promise<void> {
  if (devSandboxActive && isSandboxGameId(gameId)) {
    const patch: Partial<Game> = { updatedAt: new Date().toISOString() }
    if (fields.date !== undefined) patch.date = fields.date
    if (fields.time !== undefined) patch.time = fields.time
    if (fields.location !== undefined) patch.location = fields.location
    if (fields.homeScore !== undefined) patch.homeScore = fields.homeScore
    if (fields.awayScore !== undefined) patch.awayScore = fields.awayScore
    if (fields.status !== undefined) patch.status = fields.status
    if (fields.streamUrl !== undefined) patch.streamUrl = fields.streamUrl
    if (fields.playoffRound !== undefined) patch.playoffRound = fields.playoffRound
    if (fields.weekNumber !== undefined) patch.weekNumber = fields.weekNumber ?? 0
    if (fields.isPlayoff !== undefined) patch.isPlayoff = fields.isPlayoff
    if (fields.playerOfGameId !== undefined) patch.playerOfGameId = fields.playerOfGameId
    if (fields.homeTeamId !== undefined) {
      const team = await resolveTeam(fields.homeTeamId)
      patch.homeTeamId = team?.slug ?? ''
      patch.homeTeamUUID = fields.homeTeamId ?? undefined
    }
    if (fields.awayTeamId !== undefined) {
      const team = await resolveTeam(fields.awayTeamId)
      patch.awayTeamId = team?.slug ?? ''
      patch.awayTeamUUID = fields.awayTeamId ?? undefined
    }
    updateSandboxGame(gameId, patch)
    return
  }
  await apiRequest(`/api/admin/games/${gameId}`, { method: 'PATCH', body: fields })
}

export async function deleteGame(gameId: string): Promise<void> {
  if (devSandboxActive && isSandboxGameId(gameId)) {
    deleteSandboxGame(gameId)
    return
  }
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
  if (devSandboxActive && isSandboxGameId(gameId)) {
    // Kept out of Supabase entirely in dev -- see lib/devSandbox.ts. Scores
    // and status are enough to test the schedule/bracket generators; the
    // individual stat lines aren't tracked locally.
    updateSandboxGame(gameId, {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      status: input.status ?? 'completed',
      playerOfGameId: input.playerOfGameId ?? null,
      updatedAt: new Date().toISOString(),
    })
    return
  }
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
  draftStreamUrl?: string | null
  showHomeFixtures?: boolean
  showHomeStats?: boolean
}

export async function updateLeagueConfig(
  fields: LeagueConfigWriteFields
): Promise<LeagueConfig> {
  if (devSandboxActive) {
    // Kept out of Supabase entirely in dev -- see lib/devSandbox.ts. Nothing
    // reads this return value, so an empty stub is fine here.
    setSandboxConfig({
      ...(fields.currentWeek !== undefined && { current_week: fields.currentWeek }),
      ...(fields.totalWeeks !== undefined && { total_weeks: fields.totalWeeks }),
      ...(fields.season !== undefined && { season: fields.season }),
      ...(fields.leagueName !== undefined && { league_name: fields.leagueName }),
      ...(fields.startDate !== undefined && { start_date: fields.startDate }),
      ...(fields.endDate !== undefined && { end_date: fields.endDate }),
      ...(fields.phase !== undefined && { phase: fields.phase }),
      ...(fields.draftStreamUrl !== undefined && {
        draft_stream_url: fields.draftStreamUrl,
      }),
      ...(fields.showHomeFixtures !== undefined && {
        show_home_fixtures: fields.showHomeFixtures,
      }),
      ...(fields.showHomeStats !== undefined && {
        show_home_stats: fields.showHomeStats,
      }),
    })
    return {} as LeagueConfig
  }

  const { config } = await apiRequest<{ config: LeagueConfig }>(
    '/api/admin/league-config',
    { method: 'PATCH', body: fields }
  )
  return config
}

/**
 * Sets the snake draft order. `order` is team ids, index 0 = pick 1.
 * Rejected by the API once the draft has a pick recorded.
 */
export async function setDraftOrder(order: string[]): Promise<void> {
  if (devSandboxActive) {
    // Kept out of Supabase entirely in dev -- see lib/devSandbox.ts.
    setSandboxDraftOrder(order)
    return
  }
  await apiRequest('/api/admin/draft/order', { method: 'PATCH', body: { order } })
}

/**
 * Archives the current season's rosters, games, stats and standings under
 * `label`, then clears the live tables so the next season starts from zero.
 * Not available in the local sandbox -- unlike picks, games and phase
 * changes, this always writes to the real Supabase project, so it should
 * only ever be run for real, deliberately, once a season has actually ended.
 */
export async function archiveSeason(label: string): Promise<void> {
  await apiRequest('/api/admin/archive-season', { method: 'POST', body: { label } })
}

/* -------------------------------------------------------------------------- */
/* Commissioner's board                                                        */
/* -------------------------------------------------------------------------- */

function transformCommissionerPost(raw: any): CommissionerPost {
  return {
    id: raw.id,
    body: raw.body,
    mediaType: raw.media_type,
    mediaUrl: raw.media_url,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

/** Newest first. `limit` keeps the homepage feed from growing unbounded. */
export async function getCommissionerPosts(limit = 20): Promise<CommissionerPost[]> {
  const { data, error } = await supabase
    .from('commissioner_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching commissioner posts:', error)
    return []
  }
  return (data ?? []).map(transformCommissionerPost)
}

function commissionerPostFormData(fields: CommissionerPostWriteFields): FormData {
  const formData = new FormData()
  formData.append('body', fields.body)
  formData.append('mediaType', fields.mediaType)
  if (fields.mediaType === 'youtube' && fields.mediaUrl) {
    formData.append('mediaUrl', fields.mediaUrl)
  }
  if (fields.mediaType === 'image' && fields.imageFile) {
    formData.append('file', fields.imageFile)
  }
  return formData
}

export async function createCommissionerPost(
  fields: CommissionerPostWriteFields
): Promise<string> {
  const { id } = await apiRequest<{ id: string }>('/api/admin/commissioner-posts', {
    method: 'POST',
    formData: commissionerPostFormData(fields),
  })
  return id
}

export async function updateCommissionerPost(
  postId: string,
  fields: CommissionerPostWriteFields
): Promise<void> {
  await apiRequest(`/api/admin/commissioner-posts/${postId}`, {
    method: 'PATCH',
    formData: commissionerPostFormData(fields),
  })
}

export async function deleteCommissionerPost(postId: string): Promise<void> {
  await apiRequest(`/api/admin/commissioner-posts/${postId}`, { method: 'DELETE' })
}

/* -------------------------------------------------------------------------- */
/* Signups                                                                     */
/* -------------------------------------------------------------------------- */

export interface SignupInput {
  name: string
  age: number
  /** At least one of email or phone is required; the server checks too. */
  email?: string
  phone?: string
  position?: string
  experience?: string
  jerseyName: string
  jerseyNumber: number
  jerseySize: string
  notes?: string
}

/**
 * What became of a registration. `waitlisted` is not a failure: the roster cap
 * was already met, so the place is provisional and no fee should be sent yet.
 */
export type SignupOutcome =
  | { ok: true; waitlisted: boolean }
  | { ok: false; error: string }

/** Registers a player. Public -- no admin session needed. */
export async function submitSignup(
  input: SignupInput
): Promise<SignupOutcome> {
  try {
    const response = await fetch('/api/signups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    const payload = await response.json().catch(() => ({}))

    if (response.ok) return { ok: true, waitlisted: Boolean(payload.waitlisted) }

    return {
      ok: false,
      error: payload.error || 'Could not complete your registration',
    }
  } catch {
    return {
      ok: false,
      error: 'Could not reach the server. Check your connection and try again.',
    }
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
  /** ISO timestamp when the fee arrived, or null to mark it unpaid again. */
  paidAt?: string | null
  paymentMethod?: string | null
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

/* -------------------------------------------------------------------------- */
/* Questions                                                                   */
/* -------------------------------------------------------------------------- */

export interface QuestionInput {
  name: string
  email: string
  message: string
  /** Honeypot. Always empty when a person fills the form in. */
  website?: string
}

/**
 * Sends a question to the organisers. Public -- no admin session needed.
 * Resolves to null on success, or a message to show the person asking.
 */
export async function submitQuestion(
  input: QuestionInput
): Promise<string | null> {
  try {
    const response = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })

    if (response.ok) return null

    const payload = await response.json().catch(() => ({}))
    return payload.error || 'Could not send your question'
  } catch {
    return 'Could not reach the server. Check your connection and try again.'
  }
}

/** The full question list, newest first. Admin only. */
export async function getQuestions(): Promise<Question[]> {
  const { questions } = await apiRequest<{ questions: Question[] }>(
    '/api/admin/questions',
    { method: 'GET' }
  )
  return questions
}

export async function updateQuestion(
  questionId: string,
  status: QuestionStatus
): Promise<Question> {
  const { question } = await apiRequest<{ question: Question }>(
    `/api/admin/questions/${questionId}`,
    { method: 'PATCH', body: { status } }
  )
  return question
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await apiRequest(`/api/admin/questions/${questionId}`, { method: 'DELETE' })
}
