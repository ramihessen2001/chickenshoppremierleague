/**
 * Create a game. Admin only.
 *
 *   POST -> { weekNumber, date, time, location, homeTeamId, awayTeamId, ... }
 *
 * game_number is assigned automatically: regular season games take the next
 * free number from 1, playoff games from 100.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface CreateGameBody {
  weekNumber?: number
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
  streamUrl?: string | null
}

const VALID_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'postponed',
]

async function nextGameNumber(isPlayoff: boolean): Promise<number> {
  const floor = isPlayoff ? 100 : 1
  const { data } = await supabaseAdmin
    .from('games')
    .select('game_number')
    .gte('game_number', floor)
    .lt('game_number', isPlayoff ? 100000 : 100)
    .order('game_number', { ascending: false })
    .limit(1)

  const highest = data?.[0]?.game_number
  return highest ? highest + 1 : floor
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<CreateGameBody>(request)
  if (!body) return fail('Invalid request body')

  if (!body.date) return fail('date is required')
  if (!body.time) return fail('time is required')
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

  const isPlayoff = body.isPlayoff ?? false

  const { data, error } = await supabaseAdmin
    .from('games')
    .insert({
      game_number: await nextGameNumber(isPlayoff),
      week_number: isPlayoff ? 0 : body.weekNumber ?? null,
      date: body.date,
      time: body.time,
      location: body.location ?? 'TBD',
      home_team_id: body.homeTeamId ?? null,
      away_team_id: body.awayTeamId ?? null,
      home_score: body.homeScore ?? null,
      away_score: body.awayScore ?? null,
      status: body.status ?? 'scheduled',
      is_playoff: isPlayoff,
      playoff_round: body.playoffRound ?? null,
      stream_url: body.streamUrl ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating game:', error)
    return fail('Failed to create game', 500)
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
