/**
 * Create an award. Admin only.
 *
 *   POST -> { name, description?, season?, isActive?, votingStartDate?, votingEndDate? }
 *
 * When season is omitted it defaults to the current season from league_config,
 * so awards no longer carry a hardcoded season string.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface CreateAwardBody {
  name?: string
  description?: string
  season?: string
  isActive?: boolean
  votingStartDate?: string | null
  votingEndDate?: string | null
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<CreateAwardBody>(request)
  if (!body) return fail('Invalid request body')
  if (!body.name?.trim()) return fail('name is required')

  let season = body.season?.trim()
  if (!season) {
    const { data: config } = await supabaseAdmin
      .from('league_config')
      .select('season')
      .limit(1)
      .maybeSingle()
    season = config?.season ?? 'Unknown season'
  }

  const { data, error } = await supabaseAdmin
    .from('awards')
    .insert({
      name: body.name.trim(),
      description: body.description ?? null,
      season,
      is_active: body.isActive ?? true,
      voting_start_date: body.votingStartDate ?? null,
      voting_end_date: body.votingEndDate ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating award:', error)
    return fail('Failed to create award', 500)
  }

  return NextResponse.json({ award: data }, { status: 201 })
}
