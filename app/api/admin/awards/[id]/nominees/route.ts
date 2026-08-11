/**
 * Add a nominee to an award. Admin only.
 *
 *   POST -> { playerId }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id: awardId } = await params
  const body = await readJson<{ playerId?: string }>(request)
  if (!body?.playerId) return fail('playerId is required')

  const { data, error } = await supabaseAdmin
    .from('award_nominees')
    .insert({ award_id: awardId, player_id: body.playerId })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return fail('That player is already nominated for this award', 409)
    }
    console.error('Error adding nominee:', error)
    return fail('Failed to add nominee', 500)
  }

  return NextResponse.json({ nominee: data }, { status: 201 })
}
