/**
 * Mark a question answered, or delete it. Admin only.
 *
 *   PATCH  -> { status }
 *   DELETE -> removes the question
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

const VALID_STATUSES = ['new', 'answered']

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await readJson<{ status?: string }>(request)
  if (!body) return fail('Invalid request body')

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return fail(`status must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  const { data: question, error } = await supabaseAdmin
    .from('questions')
    .update({ status: body.status })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating question:', error)
    return fail('Failed to update question', 500)
  }

  return NextResponse.json({ question })
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin.from('questions').delete().eq('id', id)

  if (error) {
    console.error('Error deleting question:', error)
    return fail('Failed to delete question', 500)
  }

  return NextResponse.json({ success: true })
}
