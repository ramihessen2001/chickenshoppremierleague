/**
 * Replace a game's whole box score in one call. Admin only.
 *
 *   PUT -> { homeScore, awayScore, status?, playerOfGameId?, statistics: [...] }
 *
 * The statistics array is authoritative: whatever is sent becomes the complete
 * set of statistics for the game. That matches how the edit modal works (it
 * holds the full list in local state) and avoids the old delete-then-insert
 * loop running one HTTP round trip per statistic.
 *
 * Each statistic only needs a playerId. The server looks up that player's team
 * rather than trusting a team id from the browser, so a stat can never be filed
 * against the wrong team.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

const VALID_STAT_TYPES = [
  'goal',
  'assist',
  'save',
  'yellow_card',
  'red_card',
  'blue_card',
]

const VALID_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
]

interface IncomingStat {
  playerId?: string
  type?: string
  count?: number
}

interface BoxScoreBody {
  homeScore?: number | null
  awayScore?: number | null
  status?: string
  playerOfGameId?: string | null
  statistics?: IncomingStat[]
}

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: gameId } = await params
  const body = await readJson<BoxScoreBody>(request)
  if (!body) return fail('Invalid request body')

  const statistics = body.statistics ?? []
  if (!Array.isArray(statistics)) return fail('statistics must be an array')

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return fail(`status must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  for (const stat of statistics) {
    if (!stat.playerId) return fail('Every statistic needs a playerId')
    if (!stat.type || !VALID_STAT_TYPES.includes(stat.type)) {
      return fail(`Invalid stat type: ${stat.type}`)
    }
    if (stat.count !== undefined && (!Number.isInteger(stat.count) || stat.count < 1)) {
      return fail('Statistic count must be a positive whole number')
    }
  }

  // Resolve every referenced player to its team in a single query.
  const playerIds = [...new Set(statistics.map((s) => s.playerId!))]
  const teamByPlayer = new Map<string, string>()

  if (playerIds.length > 0) {
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('id, team_id')
      .in('id', playerIds)

    if (playersError) {
      console.error('Error resolving players:', playersError)
      return fail('Failed to resolve players', 500)
    }

    for (const player of players ?? []) {
      teamByPlayer.set(player.id, player.team_id)
    }

    const unknown = playerIds.filter((pid) => !teamByPlayer.has(pid))
    if (unknown.length > 0) {
      return fail(`Unknown player id(s): ${unknown.join(', ')}`)
    }
  }

  // Update the game row first; if this fails we have not touched statistics.
  const { error: gameError } = await supabaseAdmin
    .from('games')
    .update({
      home_score: body.homeScore ?? null,
      away_score: body.awayScore ?? null,
      status: body.status ?? 'completed',
      player_of_game_id: body.playerOfGameId ?? null,
    })
    .eq('id', gameId)

  if (gameError) {
    console.error('Error updating game:', gameError)
    return fail('Failed to update game', 500)
  }

  const { error: deleteError } = await supabaseAdmin
    .from('game_statistics')
    .delete()
    .eq('game_id', gameId)

  if (deleteError) {
    console.error('Error clearing statistics:', deleteError)
    return fail('Failed to clear existing statistics', 500)
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
      return fail('Failed to save statistics', 500)
    }
  }

  return NextResponse.json({ success: true })
}
