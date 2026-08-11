/**
 * Update or delete an award. Admin only.
 *
 *   PATCH  -> partial award fields
 *   DELETE -> removes the award, its nominees and its votes (cascade)
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface UpdateAwardBody {
  name?: string
  description?: string | null
  season?: string
  isActive?: boolean
  votingStartDate?: string | null
  votingEndDate?: string | null
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await readJson<UpdateAwardBody>(request)
  if (!body) return fail('Invalid request body')

  if (body.name !== undefined && !body.name.trim()) {
    return fail('name cannot be empty')
  }

  const columns: Record<string, unknown> = {}
  if (body.name !== undefined) columns.name = body.name.trim()
  if (body.description !== undefined) columns.description = body.description
  if (body.season !== undefined) columns.season = body.season
  if (body.isActive !== undefined) columns.is_active = body.isActive
  if (body.votingStartDate !== undefined) {
    columns.voting_start_date = body.votingStartDate
  }
  if (body.votingEndDate !== undefined) {
    columns.voting_end_date = body.votingEndDate
  }

  if (Object.keys(columns).length === 0) return fail('No fields to update')

  const { data, error } = await supabaseAdmin
    .from('awards')
    .update(columns)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating award:', error)
    return fail('Failed to update award', 500)
  }

  return NextResponse.json({ award: data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin.from('awards').delete().eq('id', id)

  if (error) {
    console.error('Error deleting award:', error)
    return fail('Failed to delete award', 500)
  }

  return NextResponse.json({ success: true })
}
