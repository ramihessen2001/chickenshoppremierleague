/**
 * Create a player. Admin only.
 *
 *   POST -> { name, jerseyNumber, teamId, position?, isActive?, age?, headshotUrl? }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface CreatePlayerBody {
  name?: string
  jerseyNumber?: number | null
  teamId?: string
  position?: string | null
  isActive?: boolean
  age?: number | null
  headshotUrl?: string | null
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<CreatePlayerBody>(request)
  if (!body) return fail('Invalid request body')

  if (!body.name?.trim()) return fail('name is required')
  if (!body.teamId) return fail('teamId is required')
  // jerseyNumber may be null -- that is how "TBD" is stored.
  if (
    body.jerseyNumber !== null &&
    body.jerseyNumber !== undefined &&
    (!Number.isInteger(body.jerseyNumber) ||
      body.jerseyNumber < 0 ||
      body.jerseyNumber > 999)
  ) {
    return fail('jerseyNumber must be a whole number between 0 and 999, or null')
  }
  // Matches the CHECK on players.age: a typo guard, not the 14-25 eligibility
  // rule, which stays a judgement for an organiser.
  if (
    body.age !== null &&
    body.age !== undefined &&
    (!Number.isInteger(body.age) || body.age < 5 || body.age > 99)
  ) {
    return fail('age must be a whole number between 5 and 99, or null')
  }

  const { data, error } = await supabaseAdmin
    .from('players')
    .insert({
      name: body.name.trim(),
      jersey_number: body.jerseyNumber ?? null,
      team_id: body.teamId,
      position: body.position ?? null,
      is_active: body.isActive ?? true,
      age: body.age ?? null,
      headshot_url: body.headshotUrl ?? null,
    })
    .select('id')
    .single()

  if (error) {
    // 23505 is a unique-violation; the only unique constraint here is
    // (team_id, jersey_number), so this is always a duplicate shirt number.
    if (error.code === '23505') {
      return fail(`Jersey number ${body.jerseyNumber} is already taken on this team`, 409)
    }
    console.error('Error creating player:', error)
    return fail('Failed to create player', 500)
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
