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
 *
 * Statkeepers hit the narrower `/api/statkeeper/games/[id]/box-score` route
 * instead, which shares the write path in `lib/boxScore.ts` but with a smaller
 * allowlist -- see that route for what's restricted.
 */

import { NextResponse } from 'next/server'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'
import { ALL_STATUSES, ALL_STAT_TYPES, saveBoxScore, type BoxScoreInput } from '@/lib/boxScore'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: gameId } = await params
  const body = await readJson<BoxScoreInput>(request)
  if (!body) return fail('Invalid request body')

  const result = await saveBoxScore(gameId, body, {
    allowedStatTypes: ALL_STAT_TYPES,
    allowedStatuses: ALL_STATUSES,
    canSetPlayerOfGame: true,
  })

  if (!result.ok) return fail(result.error, result.status)
  return NextResponse.json({ success: true })
}
