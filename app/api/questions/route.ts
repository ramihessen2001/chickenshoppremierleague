/**
 * Ask the organisers something. Public.
 *
 *   POST -> { name, email, message, website? }
 *
 * Like `signups`, the questions table has RLS on with no policies, so the anon
 * key cannot read or write it: these rows hold email addresses, and the only
 * way in is this route using the service role key server-side.
 *
 * `website` is a honeypot. It is hidden from people and left empty by them, so
 * anything that fills it is a bot -- answered with a cheerful 201 and dropped
 * on the floor, because telling a spammer it failed only invites a retry.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson } from '@/lib/apiAuth'

interface QuestionBody {
  name?: string
  email?: string
  message?: string
  website?: string
}

/** Deliberately permissive -- just enough to catch a typo, not to police form. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MAX_LENGTHS = {
  name: 200,
  email: 255,
  message: 2000,
}

export async function POST(request: Request) {
  const body = await readJson<QuestionBody>(request)
  if (!body) return fail('Invalid request body')

  if (body.website) return NextResponse.json({ success: true }, { status: 201 })

  const name = body.name?.trim() ?? ''
  const email = body.email?.trim().toLowerCase() ?? ''
  const message = body.message?.trim() ?? ''

  if (!name) return fail('Please enter your name')
  if (name.length > MAX_LENGTHS.name) return fail('That name is too long')
  if (!email) return fail('Please enter your email address')
  if (!EMAIL_PATTERN.test(email) || email.length > MAX_LENGTHS.email) {
    return fail('Please enter a valid email address')
  }
  if (!message) return fail('Please enter your question')
  if (message.length > MAX_LENGTHS.message) {
    return fail('That question is too long — please shorten it')
  }

  const { error } = await supabaseAdmin
    .from('questions')
    .insert({ name, email, message, status: 'new' })

  if (error) {
    console.error('Error saving question:', error)
    return fail('Could not send your question', 500)
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
