/**
 * Replace a game's statistics. Statkeeper (or admin) only.
 *
 *   PUT -> { status?, statistics: [...] }
 *
 * Narrower than the admin box-score route: a statkeeper can record goals,
 * assists, saves, yellow cards and red cards, and move the game between
 * scheduled/in progress/completed, but cannot touch blue cards, cancel or
 * postpone a game, or set the man of the match -- those stay admin-only. The
 * write path itself is shared with admin in lib/boxScore.ts.
 */

import { NextResponse } from 'next/server'
import { fail, readJson, requireStatkeeper } from '@/lib/apiAuth'
import { saveBoxScore, type BoxScoreInput } from '@/lib/boxScore'

const STATKEEPER_STAT_TYPES = ['goal', 'assist', 'save', 'yellow_card', 'red_card'] as const
const STATKEEPER_STATUSES = ['scheduled', 'in_progress', 'completed'] as const

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireStatkeeper()
  if (denied) return denied

  const { id: gameId } = await params
  const body = await readJson<BoxScoreInput>(request)
  if (!body) return fail('Invalid request body')

  const result = await saveBoxScore(gameId, body, {
    allowedStatTypes: STATKEEPER_STAT_TYPES,
    allowedStatuses: STATKEEPER_STATUSES,
    canSetPlayerOfGame: false,
  })

  if (!result.ok) return fail(result.error, result.status)
  return NextResponse.json({ success: true })
}
