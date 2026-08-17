/**
 * Set the snake draft order. Admin only.
 *
 *   PATCH -> { order: string[] }   team ids, index 0 is pick 1
 *
 * Only works before the first pick: reordering mid-draft would silently
 * change whose turn every future pick belongs to, including picks already
 * made under the old order. This does not touch the snake logic itself
 * (lib/draft.ts) -- it only ever writes teams.draft_position, which
 * teamOnPick() already reads.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface OrderBody {
  order?: string[]
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<OrderBody>(request)
  if (!body?.order || !Array.isArray(body.order) || body.order.length === 0) {
    return fail('order must be a non-empty list of team ids')
  }

  const ids = body.order
  if (new Set(ids).size !== ids.length) {
    return fail('order cannot list the same team twice')
  }

  const { count: draftedCount, error: countError } = await supabaseAdmin
    .from('signups')
    .select('*', { count: 'exact', head: true })
    .not('pick_number', 'is', null)

  if (countError) {
    console.error('Error checking draft progress:', countError)
    return fail('Failed to check draft progress', 500)
  }
  if ((draftedCount ?? 0) > 0) {
    return fail('The draft order cannot change once the draft has started', 409)
  }

  const { data: teams, error: teamsError } = await supabaseAdmin.from('teams').select('id')
  if (teamsError) {
    console.error('Error reading teams:', teamsError)
    return fail('Failed to read teams', 500)
  }

  const knownIds = new Set((teams ?? []).map((t) => t.id))
  if (ids.length !== knownIds.size || ids.some((id) => !knownIds.has(id))) {
    return fail('order must list every team exactly once')
  }

  // One row each -- there are only ever a handful of teams, so a loop here
  // is simpler than reaching for a bulk upsert.
  for (const [index, teamId] of ids.entries()) {
    const { error } = await supabaseAdmin
      .from('teams')
      .update({ draft_position: index + 1 })
      .eq('id', teamId)

    if (error) {
      console.error('Error setting draft position:', error)
      return fail('Failed to set the draft order', 500)
    }
  }

  return NextResponse.json({ ok: true })
}
