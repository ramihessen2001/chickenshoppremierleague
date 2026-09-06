/**
 * Join the league updates list. Public.
 *
 *   POST -> { email }
 *
 * Separate from /api/signups on purpose. That route registers somebody to
 * play and writes a row we keep; this one only forwards an address to Klaviyo
 * and stores nothing, because there is nothing here worth storing -- the list
 * is the record, and Klaviyo holds the unsubscribe.
 *
 * Deliberately quiet about whether an address is already subscribed: this is
 * an unauthenticated endpoint, and answering that question turns it into a way
 * to test whether a given person follows the league.
 */

import { NextResponse } from 'next/server'
import { fail, readJson } from '@/lib/apiAuth'
import { subscribeToMarketing, isKlaviyoConfigured } from '@/lib/klaviyo'

interface SubscribeBody {
  email?: string
  /** Honeypot. Real people never see it, so anything in it is a bot. */
  website?: string
}

/** Deliberately loose -- the provider does the real validation. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const body = await readJson<SubscribeBody>(request)

  // Answer a filled honeypot exactly as if it worked, so a bot learns nothing.
  if (body?.website) return NextResponse.json({ ok: true })

  const email = body?.email?.trim().toLowerCase() ?? ''
  if (!email || !EMAIL.test(email) || email.length > 254) {
    return fail('That does not look like an email address')
  }

  if (!isKlaviyoConfigured('league')) {
    // Not an error the visitor caused, and not one they can do anything about.
    console.warn('League updates list is not configured; dropping', email)
    return fail('Sign-ups are not available right now', 503)
  }

  await subscribeToMarketing(email, null, new Date(), 'league')
  return NextResponse.json({ ok: true })
}
