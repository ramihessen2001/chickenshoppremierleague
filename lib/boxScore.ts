/**
 * Shared box-score write path. SERVER ONLY.
 *
 * Admin and statkeeper both replace a game's whole box score in one call; they
 * differ only in which stat types and statuses they're allowed to send, and
 * whether they may set the man of the match. Both API routes call this with
 * their own allowlist rather than duplicating the Supabase writes.
 *
 * The first save that leaves a game completed also posts a full-time result
 * to the commissioner's board -- see the bottom of this file. That post is
 * best-effort: its failure never fails the save, the same way a trade's board
 * post does not undo the trade in lib/tradeAnnouncement.ts's caller.
 */

import 'server-only'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { composeResultAnnouncement, type AnnouncementScorer } from '@/lib/resultAnnouncement'

export const ALL_STAT_TYPES = [
  'goal',
  'assist',
  'save',
  'yellow_card',
  'red_card',
  'blue_card',
] as const

export const ALL_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
] as const

export interface IncomingStat {
  playerId?: string
  type?: string
  count?: number
}

export interface BoxScoreInput {
  homeScore?: number | null
  awayScore?: number | null
  status?: string
  playerOfGameId?: string | null
  statistics?: IncomingStat[]
}

export interface SaveBoxScoreOptions {
  /** Stat types this caller may write. */
  allowedStatTypes: readonly string[]
  /** Game statuses this caller may set. */
  allowedStatuses: readonly string[]
  /** Whether this caller may change the man of the match. */
  canSetPlayerOfGame: boolean
}

export type SaveBoxScoreResult =
  | { ok: true }
  | { ok: false; error: string; status: number }

export async function saveBoxScore(
  gameId: string,
  body: BoxScoreInput,
  options: SaveBoxScoreOptions
): Promise<SaveBoxScoreResult> {
  const statistics = body.statistics ?? []
  if (!Array.isArray(statistics)) {
    return { ok: false, error: 'statistics must be an array', status: 400 }
  }

  if (body.status && !options.allowedStatuses.includes(body.status)) {
    return {
      ok: false,
      error: `status must be one of: ${options.allowedStatuses.join(', ')}`,
      status: 400,
    }
  }

  for (const stat of statistics) {
    if (!stat.playerId) {
      return { ok: false, error: 'Every statistic needs a playerId', status: 400 }
    }
    if (!stat.type || !options.allowedStatTypes.includes(stat.type)) {
      return { ok: false, error: `Invalid stat type: ${stat.type}`, status: 400 }
    }
    if (stat.count !== undefined && (!Number.isInteger(stat.count) || stat.count < 1)) {
      return {
        ok: false,
        error: 'Statistic count must be a positive whole number',
        status: 400,
      }
    }
  }

  if (body.playerOfGameId !== undefined && !options.canSetPlayerOfGame) {
    return {
      ok: false,
      error: 'Not allowed to set the man of the match',
      status: 403,
    }
  }

  // Needed both to resolve players below and to tell, after the write, whether
  // this save is the one that just completed the game.
  const { data: previousGame, error: previousGameError } = await supabaseAdmin
    .from('games')
    .select('status, home_team_id, away_team_id, player_of_game_id')
    .eq('id', gameId)
    .single()

  if (previousGameError || !previousGame) {
    console.error('Error loading game before box score save:', previousGameError)
    return { ok: false, error: 'Game not found', status: 404 }
  }

  // Resolve every referenced player to its team (and name, for the board post
  // below) in a single query.
  const playerIds = [...new Set(statistics.map((s) => s.playerId!))]
  const teamByPlayer = new Map<string, string>()
  const nameByPlayer = new Map<string, string>()

  if (playerIds.length > 0) {
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('id, team_id, name')
      .in('id', playerIds)

    if (playersError) {
      console.error('Error resolving players:', playersError)
      return { ok: false, error: 'Failed to resolve players', status: 500 }
    }

    for (const player of players ?? []) {
      teamByPlayer.set(player.id, player.team_id)
      nameByPlayer.set(player.id, player.name)
    }

    const unknown = playerIds.filter((pid) => !teamByPlayer.has(pid))
    if (unknown.length > 0) {
      return {
        ok: false,
        error: `Unknown player id(s): ${unknown.join(', ')}`,
        status: 400,
      }
    }
  }

  // Update the game row first; if this fails we have not touched statistics.
  const newStatus = body.status ?? 'completed'
  const gameUpdate: Record<string, unknown> = {
    home_score: body.homeScore ?? null,
    away_score: body.awayScore ?? null,
    status: newStatus,
  }
  if (options.canSetPlayerOfGame) {
    gameUpdate.player_of_game_id = body.playerOfGameId ?? null
  }

  const { error: gameError } = await supabaseAdmin
    .from('games')
    .update(gameUpdate)
    .eq('id', gameId)

  if (gameError) {
    console.error('Error updating game:', gameError)
    return { ok: false, error: 'Failed to update game', status: 500 }
  }

  const { error: deleteError } = await supabaseAdmin
    .from('game_statistics')
    .delete()
    .eq('game_id', gameId)

  if (deleteError) {
    console.error('Error clearing statistics:', deleteError)
    return { ok: false, error: 'Failed to clear existing statistics', status: 500 }
  }

  if (statistics.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from('game_statistics')
      .insert(
        statistics.map((stat) => ({
          game_id: gameId,
          player_id: stat.playerId!,
          team_id: teamByPlayer.get(stat.playerId!)!,
          stat_type: stat.type!,
          count: stat.count ?? 1,
        }))
      )

    if (insertError) {
      console.error('Error inserting statistics:', insertError)
      return { ok: false, error: 'Failed to save statistics', status: 500 }
    }
  }

  const justCompleted = newStatus === 'completed' && previousGame.status !== 'completed'
  if (justCompleted) {
    await postResultAnnouncement({
      homeTeamId: previousGame.home_team_id,
      awayTeamId: previousGame.away_team_id,
      homeScore: body.homeScore ?? null,
      awayScore: body.awayScore ?? null,
      statistics,
      nameByPlayer,
      teamByPlayer,
      playerOfGameId: options.canSetPlayerOfGame
        ? (body.playerOfGameId ?? null)
        : previousGame.player_of_game_id,
    })
  }

  return { ok: true }
}

/**
 * Posts the full-time result to the commissioner's board. Best-effort: a
 * game that just finished has already been saved by the time this runs, so a
 * failure here is logged and swallowed rather than reported as a save error.
 */
async function postResultAnnouncement(input: {
  homeTeamId: string | null
  awayTeamId: string | null
  homeScore: number | null
  awayScore: number | null
  statistics: IncomingStat[]
  nameByPlayer: Map<string, string>
  teamByPlayer: Map<string, string>
  playerOfGameId: string | null
}): Promise<void> {
  const { homeTeamId, awayTeamId } = input
  if (!homeTeamId || !awayTeamId) return

  try {
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id, name, short_name')
      .in('id', [homeTeamId, awayTeamId])

    if (teamsError || !teams) {
      console.error('Full-time announcement: failed to load teams:', teamsError)
      return
    }

    const home = teams.find((t) => t.id === homeTeamId)
    const away = teams.find((t) => t.id === awayTeamId)
    if (!home || !away) return

    const scorersFor = (teamId: string): AnnouncementScorer[] => {
      const byPlayer = new Map<string, number>()
      for (const stat of input.statistics) {
        if (stat.type !== 'goal') continue
        if (input.teamByPlayer.get(stat.playerId!) !== teamId) continue
        byPlayer.set(stat.playerId!, (byPlayer.get(stat.playerId!) ?? 0) + (stat.count ?? 1))
      }
      return [...byPlayer.entries()]
        .map(([playerId, count]) => ({
          name: input.nameByPlayer.get(playerId) ?? 'Unknown player',
          count,
        }))
        .sort((a, b) => b.count - a.count)
    }

    let playerOfGameName: string | null = null
    if (input.playerOfGameId) {
      playerOfGameName = input.nameByPlayer.get(input.playerOfGameId) ?? null
      if (!playerOfGameName) {
        const { data: motm } = await supabaseAdmin
          .from('players')
          .select('name')
          .eq('id', input.playerOfGameId)
          .single()
        playerOfGameName = motm?.name ?? null
      }
    }

    const announcement = composeResultAnnouncement(
      { name: home.name, shortName: home.short_name },
      { name: away.name, shortName: away.short_name },
      input.homeScore ?? 0,
      input.awayScore ?? 0,
      scorersFor(homeTeamId),
      scorersFor(awayTeamId),
      playerOfGameName
    )

    const { error: postError } = await supabaseAdmin
      .from('commissioner_posts')
      .insert({ body: announcement, media_type: 'none' })

    if (postError) console.error('Full-time announcement failed to post:', postError)
  } catch (caught) {
    console.error('Full-time announcement threw:', caught)
  }
}
