/**
 * Update or delete a signup. Admin only.
 *
 *   PATCH  -> { status?, paidAt?, paymentMethod?, draftedTeamId?, notes?, ... }
 *   DELETE -> removes the registration
 *
 * Moving a signup to `confirmed` emails the player to say their place is
 * secured -- the one notification the site sends off the back of an admin
 * action, and only on the transition, never on a later edit.
 *
 * PATCH also supports `createPlayer: true`, which turns a signup into a real
 * player on the drafted team in one step -- the usual move on draft night.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'
import { sendEmail, placeConfirmedEmail } from '@/lib/email'

const VALID_STATUSES = [
  'pending',
  'confirmed',
  'waitlisted',
  'withdrawn',
  'drafted',
]

interface UpdateSignupBody {
  name?: string
  email?: string | null
  phone?: string | null
  position?: string | null
  experience?: string | null
  notes?: string | null
  status?: string
  paidAt?: string | null
  paymentMethod?: string | null
  draftedTeamId?: string | null
  /** Also create a player row on the drafted team. */
  createPlayer?: boolean
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const body = await readJson<UpdateSignupBody>(request)
  if (!body) return fail('Invalid request body')

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return fail(`status must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  const columns: Record<string, unknown> = {}
  if (body.name !== undefined) columns.name = body.name.trim()
  if (body.email !== undefined) {
    columns.email = body.email?.trim().toLowerCase() || null
  }
  if (body.phone !== undefined) columns.phone = body.phone
  if (body.position !== undefined) columns.position = body.position
  if (body.experience !== undefined) columns.experience = body.experience
  if (body.notes !== undefined) columns.notes = body.notes
  if (body.status !== undefined) columns.status = body.status
  if (body.paidAt !== undefined) columns.paid_at = body.paidAt
  if (body.paymentMethod !== undefined) {
    columns.payment_method = body.paymentMethod?.slice(0, 50) ?? null
  }
  if (body.draftedTeamId !== undefined) columns.drafted_team_id = body.draftedTeamId

  if (Object.keys(columns).length === 0) return fail('No fields to update')

  // Read the status first so the confirmation email only goes out on the
  // change itself. Without this, every later edit to a confirmed player --
  // a phone number, a draft pick -- would send it again.
  const { data: before } = await supabaseAdmin
    .from('signups')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  const { data: signup, error } = await supabaseAdmin
    .from('signups')
    .update(columns)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return fail('That email address is already registered for this season', 409)
    }
    console.error('Error updating signup:', error)
    return fail('Failed to update signup', 500)
  }

  // Players who registered with a phone number alone have nowhere to send
  // this; they get told in person.
  if (
    body.status === 'confirmed' &&
    before?.status !== 'confirmed' &&
    signup.email
  ) {
    await sendEmail({
      to: signup.email,
      ...placeConfirmedEmail(signup.name),
    })
  }

  // Draft night shortcut: promote the signup to a player on their new team.
  // The shirt number is left null (shown as "TBD") and assigned later.
  if (body.createPlayer) {
    const teamId = body.draftedTeamId ?? signup.drafted_team_id
    if (!teamId) {
      return fail('Assign a team before creating the player', 400)
    }

    const { data: existing } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('team_id', teamId)
      .ilike('name', signup.name)
      .maybeSingle()

    if (!existing) {
      const { error: playerError } = await supabaseAdmin.from('players').insert({
        name: signup.name,
        jersey_number: null,
        team_id: teamId,
        position: signup.position ?? null,
        is_active: true,
      })

      if (playerError) {
        console.error('Error creating player from signup:', playerError)
        return fail(
          'Signup updated, but the player could not be created. Add them manually.',
          500
        )
      }
    }
  }

  return NextResponse.json({ signup })
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin.from('signups').delete().eq('id', id)

  if (error) {
    console.error('Error deleting signup:', error)
    return fail('Failed to delete signup', 500)
  }

  return NextResponse.json({ success: true })
}
