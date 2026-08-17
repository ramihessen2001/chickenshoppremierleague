/**
 * Update league configuration. Admin only.
 *
 *   PATCH -> { currentWeek?, season?, leagueName?, startDate?, endDate?,
 *              totalWeeks?, playoffsStarted? }
 *
 * league_config holds exactly one row (enforced by a unique index in the
 * schema), so this updates whichever row exists rather than taking an id.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

const VALID_PHASES = ['signups', 'draft', 'season', 'playoffs']

interface UpdateConfigBody {
  currentWeek?: number
  totalWeeks?: number
  season?: string
  leagueName?: string
  startDate?: string
  endDate?: string
  phase?: string
  standingsImageUrl?: string | null
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<UpdateConfigBody>(request)
  if (!body) return fail('Invalid request body')

  if (
    body.currentWeek !== undefined &&
    (!Number.isInteger(body.currentWeek) || body.currentWeek < 0)
  ) {
    return fail('currentWeek must be a whole number of 0 or more')
  }
  if (
    body.totalWeeks !== undefined &&
    (!Number.isInteger(body.totalWeeks) || body.totalWeeks < 1)
  ) {
    return fail('totalWeeks must be a whole number of 1 or more')
  }

  const columns: Record<string, unknown> = {}
  if (body.currentWeek !== undefined) columns.current_week = body.currentWeek
  if (body.totalWeeks !== undefined) columns.total_weeks = body.totalWeeks
  if (body.season !== undefined) columns.season = body.season
  if (body.leagueName !== undefined) columns.league_name = body.leagueName
  if (body.startDate !== undefined) columns.start_date = body.startDate
  if (body.endDate !== undefined) columns.end_date = body.endDate
  if (body.phase !== undefined) {
    if (!VALID_PHASES.includes(body.phase)) {
      return fail(`phase must be one of: ${VALID_PHASES.join(', ')}`)
    }
    columns.phase = body.phase
  }
  if (body.standingsImageUrl !== undefined) {
    columns.standings_image_url = body.standingsImageUrl
  }

  if (Object.keys(columns).length === 0) return fail('No fields to update')

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('league_config')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (fetchError || !existing) {
    console.error('League config row missing:', fetchError)
    return fail('League config not found -- has database/schema.sql been run?', 404)
  }

  const { data, error } = await supabaseAdmin
    .from('league_config')
    .update(columns)
    .eq('id', existing.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating league config:', error)
    return fail('Failed to update league config', 500)
  }

  return NextResponse.json({ config: data })
}
