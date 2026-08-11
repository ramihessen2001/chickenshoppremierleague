/**
 * Update or delete a player. Admin only.
 *
 *   PATCH  -> partial player fields
 *   DELETE -> removes the player and their statistics (cascade)
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface UpdatePlayerBody {
  name?: string
  jerseyNumber?: number | null
  teamId?: string
  position?: string | null
  isActive?: boolean
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await readJson<UpdatePlayerBody>(request)
  if (!body) return fail('Invalid request body')

  if (body.name !== undefined && !body.name.trim()) {
    return fail('name cannot be empty')
  }
  // jerseyNumber may be null -- that is how "TBD" is stored.
  if (
    body.jerseyNumber !== undefined &&
    body.jerseyNumber !== null &&
    (!Number.isInteger(body.jerseyNumber) ||
      body.jerseyNumber < 0 ||
      body.jerseyNumber > 999)
  ) {
    return fail('jerseyNumber must be a whole number between 0 and 999, or null')
  }

  const columns: Record<string, unknown> = {}
  if (body.name !== undefined) columns.name = body.name.trim()
  if (body.jerseyNumber !== undefined) columns.jersey_number = body.jerseyNumber
  if (body.teamId !== undefined) columns.team_id = body.teamId
  if (body.position !== undefined) columns.position = body.position
  if (body.isActive !== undefined) columns.is_active = body.isActive

  if (Object.keys(columns).length === 0) return fail('No fields to update')

  const { error } = await supabaseAdmin.from('players').update(columns).eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return fail('That jersey number is already taken on this team', 409)
    }
    console.error('Error updating player:', error)
    return fail('Failed to update player', 500)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin.from('players').delete().eq('id', id)

  if (error) {
    console.error('Error deleting player:', error)
    return fail('Failed to delete player', 500)
  }

  return NextResponse.json({ success: true })
}
