/**
 * Update or delete a single game. Admin only.
 *
 *   PATCH  -> partial game fields
 *   DELETE -> removes the game (its statistics cascade)
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface UpdateGameBody {
  weekNumber?: number | null
  date?: string
  time?: string
  location?: string
  homeTeamId?: string | null
  awayTeamId?: string | null
  homeScore?: number | null
  awayScore?: number | null
  status?: string
  isPlayoff?: boolean
  playoffRound?: string | null
  playerOfGameId?: string | null
  streamUrl?: string | null
}

const VALID_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
]

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await readJson<UpdateGameBody>(request)
  if (!body) return fail('Invalid request body')

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return fail(`status must be one of: ${VALID_STATUSES.join(', ')}`)
  }
  if (
    body.homeTeamId &&
    body.awayTeamId &&
    body.homeTeamId === body.awayTeamId
  ) {
    return fail('A team cannot play itself')
  }

  // Map camelCase request fields onto snake_case columns, skipping anything the
  // caller did not send so a partial update stays partial.
  const columns: Record<string, unknown> = {}
  const assign = (column: string, value: unknown) => {
    if (value !== undefined) columns[column] = value
  }

  assign('week_number', body.weekNumber)
  assign('date', body.date)
  assign('time', body.time)
  assign('location', body.location)
  assign('home_team_id', body.homeTeamId)
  assign('away_team_id', body.awayTeamId)
  assign('home_score', body.homeScore)
  assign('away_score', body.awayScore)
  assign('status', body.status)
  assign('is_playoff', body.isPlayoff)
  assign('playoff_round', body.playoffRound)
  assign('player_of_game_id', body.playerOfGameId)
  assign('stream_url', body.streamUrl)

  if (Object.keys(columns).length === 0) {
    return fail('No fields to update')
  }

  const { error } = await supabaseAdmin.from('games').update(columns).eq('id', id)

  if (error) {
    console.error('Error updating game:', error)
    return fail('Failed to update game', 500)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin.from('games').delete().eq('id', id)

  if (error) {
    console.error('Error deleting game:', error)
    return fail('Failed to delete game', 500)
  }

  return NextResponse.json({ success: true })
}
