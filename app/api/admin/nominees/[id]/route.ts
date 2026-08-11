/**
 * Remove a nominee. Admin only.
 *
 *   DELETE -> removes the nominee and any votes cast for them (cascade)
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireAdmin } from '@/lib/apiAuth'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin.from('award_nominees').delete().eq('id', id)

  if (error) {
    console.error('Error removing nominee:', error)
    return fail('Failed to remove nominee', 500)
  }

  return NextResponse.json({ success: true })
}
