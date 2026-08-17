/**
 * Update one team's row in the league table. Admin only.
 *
 *   PATCH -> { gamesPlayed, wins, draws, losses, goalsFor, goalsAgainst }
 *
 * Every field is required and replaces the row outright rather than patching
 * individual columns -- the admin form always edits the whole row at once, so
 * there is no case where only some of these are known.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface UpdateStandingBody {
  gamesPlayed?: number
  wins?: number
  draws?: number
  losses?: number
  goalsFor?: number
  goalsAgainst?: number
}

type Params = { params: Promise<{ teamId: string }> }

function isWholeNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { teamId } = await params
  const body = await readJson<UpdateStandingBody>(request)
  if (!body) return fail('Invalid request body')

  const {
    gamesPlayed, wins, draws, losses, goalsFor, goalsAgainst,
  } = body

  if (
    !isWholeNonNegative(gamesPlayed) ||
    !isWholeNonNegative(wins) ||
    !isWholeNonNegative(draws) ||
    !isWholeNonNegative(losses) ||
    !isWholeNonNegative(goalsFor) ||
    !isWholeNonNegative(goalsAgainst)
  ) {
    return fail('All fields must be whole numbers of 0 or more')
  }
  if (wins + draws + losses > gamesPlayed) {
    return fail('Wins + draws + losses cannot exceed games played')
  }

  // Upsert rather than update: a team added after the standings table was
  // seeded has no row yet, and this should still work the first time its
  // stats are edited rather than silently touching nothing.
  const { error } = await supabaseAdmin.from('standings').upsert(
    {
      team_id: teamId,
      games_played: gamesPlayed,
      wins,
      draws,
      losses,
      goals_for: goalsFor,
      goals_against: goalsAgainst,
    },
    { onConflict: 'team_id' }
  )

  if (error) {
    console.error('Error updating standing:', error)
    return fail('Failed to update the standings row', 500)
  }

  return NextResponse.json({ success: true })
}
