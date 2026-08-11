/**
 * Register for the league. Public.
 *
 *   POST -> { name, email, phone?, position?, experience?, notes? }
 *
 * Signups are only accepted while league_config.phase is 'signups', so closing
 * registration is a data change rather than a deploy.
 *
 * The signups table has RLS on with no policies, so the anon key cannot read or
 * write it at all. This route is the only way in, and it uses the service role
 * key server-side. That matters more here than elsewhere: these rows hold
 * email addresses and phone numbers.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson } from '@/lib/apiAuth'

interface SignupBody {
  name?: string
  email?: string
  phone?: string
  position?: string
  experience?: string
  notes?: string
}

/** Deliberately permissive -- just enough to catch a typo, not to police form. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_LENGTHS = {
  name: 200,
  email: 255,
  phone: 50,
  position: 50,
  experience: 50,
  notes: 1000,
}

export async function POST(request: Request) {
  const body = await readJson<SignupBody>(request)
  if (!body) return fail('Invalid request body')

  const name = body.name?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''

  if (!name) return fail('Please enter your name')
  if (name.length > MAX_LENGTHS.name) return fail('That name is too long')
  if (!email) return fail('Please enter your email address')
  if (!EMAIL_PATTERN.test(email) || email.length > MAX_LENGTHS.email) {
    return fail('Please enter a valid email address')
  }

  for (const field of ['phone', 'position', 'experience', 'notes'] as const) {
    const value = body[field]
    if (value && value.length > MAX_LENGTHS[field]) {
      return fail(`That ${field} is too long`)
    }
  }

  // Registration has to actually be open, and signups are stamped with the
  // season they belong to so a returning player can sign up again next time.
  const { data: config, error: configError } = await supabaseAdmin
    .from('league_config')
    .select('season, phase')
    .limit(1)
    .maybeSingle()

  if (configError || !config) {
    console.error('League config unavailable:', configError)
    return fail('Registration is unavailable right now', 503)
  }

  if (config.phase !== 'signups') {
    return fail('Registration is closed for this season', 403)
  }

  const { error } = await supabaseAdmin.from('signups').insert({
    name,
    email,
    phone: body.phone?.trim() || null,
    position: body.position?.trim() || null,
    experience: body.experience?.trim() || null,
    notes: body.notes?.trim() || null,
    season: config.season,
    status: 'pending',
  })

  if (error) {
    // Unique index on (season, lower(email)).
    if (error.code === '23505') {
      return fail('That email address is already registered for this season', 409)
    }
    console.error('Error creating signup:', error)
    return fail('Could not complete your registration', 500)
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
