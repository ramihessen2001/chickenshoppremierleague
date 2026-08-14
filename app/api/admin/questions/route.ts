/**
 * Read the question list. Admin only.
 *
 *   GET -> { questions: [...] }
 *
 * Newest first: unlike signups, this is an inbox rather than a register.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireAdmin } from '@/lib/apiAuth'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading questions:', error)
    return fail('Failed to load questions', 500)
  }

  return NextResponse.json({ questions: data ?? [] })
}
