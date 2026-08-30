/**
 * Make and undo draft picks. Admin only.
 *
 *   POST   -> { signupId, jerseyNumber? }  makes the next pick
 *   DELETE -> undoes the most recent pick
 *
 * The pick number is derived from how many picks exist, never sent by the
 * client, so a stale board cannot overwrite a pick someone else just made. Two
 * picks racing for the same number are caught by the unique index on
 * signups.pick_number and reported as a conflict rather than silently
 * clobbering one another.
 *
 * Shirt numbers: the player gets the number they registered with. When that is
 * already taken on the team picking them, the route makes no pick at all and
 * responds 409 with `needsNumber` and a list of suggestions, which is what
 * drives the prompt on the board.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'
import { isDraftable, isNumberFree, suggestNumbers, teamOnPick } from '@/lib/draft'

interface PickBody {
  signupId?: string
  /** Only needed when the registered number is taken. */
  jerseyNumber?: number | null
}

/** Shirt numbers already in use on a team. */
async function takenNumbers(teamId: string): Promise<(number | null)[]> {
  const { data } = await supabaseAdmin
    .from('players')
    .select('jersey_number')
    .eq('team_id', teamId)
  return (data ?? []).map((row) => row.jersey_number as number | null)
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<PickBody>(request)
  if (!body?.signupId) return fail('signupId is required')

  const { data: signup, error: signupError } = await supabaseAdmin
    .from('signups')
    .select('id, name, position, jersey_number, status, pick_number, player_id')
    .eq('id', body.signupId)
    .maybeSingle()

  if (signupError) {
    console.error('Error reading signup for pick:', signupError)
    return fail('Failed to read the registration', 500)
  }
  if (!signup) return fail('That registration no longer exists', 404)
  if (signup.pick_number !== null) {
    return fail(`${signup.name} has already been drafted`, 409)
  }
  // Captains hold a roster place without a pick number, so this is what stops
  // one being drafted onto a second team.
  if (signup.player_id !== null) {
    return fail(`${signup.name} is already on a roster`, 409)
  }
  if (
    !isDraftable({
      status: signup.status,
      pick_number: signup.pick_number as number | null,
      player_id: (signup.player_id as string | null) ?? null,
    })
  ) {
    return fail(`${signup.name} is ${signup.status} and cannot be drafted`, 409)
  }

  // Whose turn it is, derived rather than trusted from the client.
  const [{ data: teams }, { count: draftedCount }] = await Promise.all([
    supabaseAdmin.from('teams').select('id, name, draft_position'),
    supabaseAdmin
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .not('pick_number', 'is', null),
  ])

  const pickNumber = (draftedCount ?? 0) + 1
  const orderable = (teams ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    draftPosition: t.draft_position as number | null,
  }))
  const team = teamOnPick(orderable, pickNumber)

  if (!team) {
    return fail(
      'No team is on the clock. Set a draft order on the teams before starting.',
      409
    )
  }

  // Decide the shirt number before writing anything, so a clash leaves the
  // draft exactly as it was rather than half-applied.
  const taken = await takenNumbers(team.id)
  const requested = signup.jersey_number as number | null
  let jerseyNumber: number | null

  if (body.jerseyNumber !== undefined && body.jerseyNumber !== null) {
    if (!isNumberFree(body.jerseyNumber, taken)) {
      return NextResponse.json(
        {
          error: `Number ${body.jerseyNumber} is already taken on ${team.name}`,
          needsNumber: true,
          requested,
          teamName: team.name,
          suggestions: suggestNumbers(requested, taken),
        },
        { status: 409 }
      )
    }
    jerseyNumber = body.jerseyNumber
  } else if (requested !== null && isNumberFree(requested, taken)) {
    jerseyNumber = requested
  } else if (requested === null) {
    // Registered without a preference -- leave it TBD rather than inventing one.
    jerseyNumber = null
  } else {
    return NextResponse.json(
      {
        error: `${signup.name} wants number ${requested}, which is taken on ${team.name}`,
        needsNumber: true,
        requested,
        teamName: team.name,
        playerName: signup.name,
        suggestions: suggestNumbers(requested, taken),
      },
      { status: 409 }
    )
  }

  const { data: player, error: playerError } = await supabaseAdmin
    .from('players')
    .insert({
      name: signup.name,
      jersey_number: jerseyNumber,
      team_id: team.id,
      position: signup.position ?? null,
      is_active: true,
    })
    .select('id')
    .single()

  if (playerError) {
    // 23505 here is the UNIQUE(team_id, jersey_number) constraint: the number
    // was free when we checked and taken by the time we wrote.
    if (playerError.code === '23505') {
      return NextResponse.json(
        {
          error: `Number ${jerseyNumber} was just taken on ${team.name}`,
          needsNumber: true,
          requested,
          teamName: team.name,
          playerName: signup.name,
          suggestions: suggestNumbers(requested, await takenNumbers(team.id)),
        },
        { status: 409 }
      )
    }
    console.error('Error creating player for pick:', playerError)
    return fail('Failed to add the player to the roster', 500)
  }

  const { error: updateError } = await supabaseAdmin
    .from('signups')
    .update({
      status: 'drafted',
      drafted_team_id: team.id,
      pick_number: pickNumber,
      drafted_at: new Date().toISOString(),
      player_id: player.id,
    })
    .eq('id', signup.id)
    // Only if still undrafted: a second request that got this far would find
    // the row already claimed and change nothing.
    .is('pick_number', null)

  if (updateError) {
    // Roll the roster back so a failed pick does not leave a stray player.
    await supabaseAdmin.from('players').delete().eq('id', player.id)

    if (updateError.code === '23505') {
      return fail('Someone just made that pick — reload the board', 409)
    }
    console.error('Error recording pick:', updateError)
    return fail('Failed to record the pick', 500)
  }

  return NextResponse.json({
    pick: {
      pickNumber,
      name: signup.name,
      teamId: team.id,
      teamName: team.name,
      jerseyNumber,
      // True when they did not get the number they registered for.
      numberChanged: requested !== null && jerseyNumber !== requested,
    },
  })
}

/**
 * Undo the most recent pick.
 *
 * The registration goes back to `confirmed` rather than whatever it was
 * before: the pre-draft status is not recorded, and everyone in the pool is
 * confirmed or pending, so this is at worst a promotion for an unpaid player
 * that the admin can set back.
 */
export async function DELETE() {
  const denied = await requireAdmin()
  if (denied) return denied

  const { data: last, error } = await supabaseAdmin
    .from('signups')
    .select('id, name, player_id, pick_number')
    .not('pick_number', 'is', null)
    .order('pick_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error finding the last pick:', error)
    return fail('Failed to read the last pick', 500)
  }
  if (!last) return fail('There are no picks to undo', 404)

  const { error: clearError } = await supabaseAdmin
    .from('signups')
    .update({
      status: 'confirmed',
      drafted_team_id: null,
      pick_number: null,
      drafted_at: null,
      player_id: null,
    })
    .eq('id', last.id)

  if (clearError) {
    console.error('Error undoing pick:', clearError)
    return fail('Failed to undo the pick', 500)
  }

  // Clearing the signup first means a failure here leaves an unlinked player
  // to tidy up, rather than a pick that cannot be remade.
  if (last.player_id) {
    await supabaseAdmin.from('players').delete().eq('id', last.player_id)
  }

  return NextResponse.json({
    undone: { pickNumber: last.pick_number, name: last.name },
  })
}
