/**
 * Join the league updates list. Public.
 *
 *   POST -> { email }
 *
 * Separate from /api/signups on purpose. That route registers somebody to
 * play and writes a row we keep; this one takes an address for a mailing list.
 *
 * The address is written to `subscribers` BEFORE Klaviyo is called. This route
 * used to keep nothing, on the reasoning that the list was the record -- which
 * held right up until a malformed payload was rejected for two days while the
 * form told everybody "You're on the list". Those addresses could not be
 * recovered. Now a provider failure costs a retry, not the address.
 *
 * Deliberately quiet about whether an address is already subscribed: this is
 * an unauthenticated endpoint, and answering that question turns it into a way
 * to test whether a given person follows the league.
 */

import { NextResponse } from 'next/server'
import { fail, readJson } from '@/lib/apiAuth'
import { subscribeToMarketing, isKlaviyoConfigured } from '@/lib/klaviyo'
import { recordSubscriber, markSynced, markFailed } from '@/lib/subscribers'

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

  // First, so that nothing after this point can lose the address.
  const id = await recordSubscriber(email, 'league')

  const configured = isKlaviyoConfigured('league')
  const accepted = configured ? await subscribeToMarketing(email, null, 'league') : false

  if (accepted) {
    await markSynced(id)
  } else {
    await markFailed(id, configured ? 'Klaviyo rejected the request' : 'Klaviyo not configured')
    if (!configured) console.warn('League updates list is not configured;', email, 'queued')
  }

  /*
   * Success means the address is safely held somewhere we can act on -- either
   * Klaviyo took it, or it is sitting in `subscribers` waiting to be retried.
   * Only when neither is true has anything actually been lost, and that is the
   * one case worth making somebody retype their address for.
   */
  if (!accepted && !id) {
    return fail('That did not go through. Try again in a moment.', 502)
  }

  return NextResponse.json({ ok: true })
}
