/**
 * Register for the league. Public.
 *
 *   POST -> { name, age, jerseyName, jerseyNumber, jerseySize,
 *              email?, phone?, position?, experience?, notes? }
 *
 * Email and phone are individually optional but jointly required: a player has
 * to be reachable somehow. Email is the one that matters most -- it carries the
 * payment details and the confirmation -- but a phone number is enough to take
 * someone's registration and chase the rest later.
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
import { sendEmail, registrationEmail, waitlistEmail } from '@/lib/email'
import { LEAGUE } from '@/config/league'

interface SignupBody {
  name?: string
  email?: string
  age?: number
  phone?: string
  position?: string
  experience?: string
  jerseyName?: string
  jerseyNumber?: number
  jerseySize?: string
  notes?: string
}

const JERSEY_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

/** Deliberately permissive -- just enough to catch a typo, not to police form. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * A sanity range, not the league's eligibility rule. Anyone outside 14-25 is
 * left for an organiser to look at in the admin list rather than turned away
 * by the form.
 */
const AGE_RANGE = { min: 5, max: 99 }

const MAX_LENGTHS = {
  name: 200,
  email: 255,
  phone: 50,
  position: 50,
  experience: 50,
  jerseyName: 20,
  notes: 1000,
}

export async function POST(request: Request) {
  const body = await readJson<SignupBody>(request)
  if (!body) return fail('Invalid request body')

  const name = body.name?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const phone = body.phone?.trim() ?? ''

  if (!name) return fail('Please enter your name')
  if (name.length > MAX_LENGTHS.name) return fail('That name is too long')

  if (!email && !phone) {
    return fail('Please give us an email address or a phone number')
  }

  if (email && (!EMAIL_PATTERN.test(email) || email.length > MAX_LENGTHS.email)) {
    return fail('Please enter a valid email address')
  }

  // Enough digits to be a phone number rather than a typo. Formatting is left
  // alone: people write their own number in whatever shape they like.
  if (phone && (phone.replace(/\D/g, '').length < 7 || phone.length > MAX_LENGTHS.phone)) {
    return fail('Please enter a valid phone number')
  }

  const age = body.age
  if (
    typeof age !== 'number' ||
    !Number.isInteger(age) ||
    age < AGE_RANGE.min ||
    age > AGE_RANGE.max
  ) {
    return fail('Please enter a valid age')
  }

  // Kit details. Required, because the order goes in before the season and
  // chasing 64 people for a size afterwards is nobody's idea of a good time.
  const jerseyName = body.jerseyName?.trim() ?? ''
  const jerseyNumber = body.jerseyNumber
  const jerseySize = body.jerseySize?.trim().toUpperCase() ?? ''

  if (!jerseyName) return fail('Please enter the name for your jersey')
  if (jerseyName.length > MAX_LENGTHS.jerseyName) {
    return fail('That jersey name is too long')
  }
  if (
    typeof jerseyNumber !== 'number' ||
    !Number.isInteger(jerseyNumber) ||
    jerseyNumber < 0 ||
    jerseyNumber > 99
  ) {
    return fail('Please choose a jersey number between 0 and 99')
  }
  if (!JERSEY_SIZES.includes(jerseySize)) {
    return fail('Please choose a jersey size')
  }

  for (const field of ['position', 'experience', 'notes'] as const) {
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

  // The roster cap counts confirmed places, not registrations: people register
  // far more freely than they pay. Once it is reached the form keeps taking
  // people, but as a waitlist -- and they are told so rather than being asked
  // for a fee we may not be able to honour.
  const { count: confirmedCount, error: countError } = await supabaseAdmin
    .from('signups')
    .select('id', { count: 'exact', head: true })
    .eq('season', config.season)
    .eq('status', 'confirmed')

  if (countError) {
    console.error('Could not count confirmed signups:', countError)
    return fail('Registration is unavailable right now', 503)
  }

  const isWaitlisted = (confirmedCount ?? 0) >= LEAGUE.rosterCap

  const { error } = await supabaseAdmin.from('signups').insert({
    name,
    email: email || null,
    age,
    phone: phone || null,
    position: body.position?.trim() || null,
    experience: body.experience?.trim() || null,
    jersey_name: jerseyName,
    jersey_number: jerseyNumber,
    jersey_size: jerseySize,
    notes: body.notes?.trim() || null,
    season: config.season,
    status: isWaitlisted ? 'waitlisted' : 'pending',
  })

  if (error) {
    // Unique index on (season, lower(email)).
    if (error.code === '23505') {
      return fail('That email address is already registered for this season', 409)
    }
    console.error('Error creating signup:', error)
    return fail('Could not complete your registration', 500)
  }

  // Awaited, not fired and forgotten: this runs in a serverless function that
  // may be frozen the moment the response is returned. `sendEmail` swallows
  // its own failures, so a bad mail provider cannot cost someone their place.
  //
  // Someone who registered with a phone number alone gets nothing here; the
  // confirmation panel is the only place they will see the payment details.
  if (email) {
    await sendEmail({
      to: email,
      ...(isWaitlisted ? waitlistEmail(name) : registrationEmail(name)),
    })
  }

  return NextResponse.json(
    { success: true, waitlisted: isWaitlisted },
    { status: 201 }
  )
}
