/**
 * The league updates list, and the queue of addresses Klaviyo has not taken.
 * Admin only.
 *
 *   GET  -> { pending: [...] }   everything still waiting on Klaviyo
 *   POST -> { synced, failed }   retries every one of them
 *
 * The retry exists because the table only earns its keep if there is a way to
 * drain it. Sending an address Klaviyo already has is harmless -- the
 * subscribe endpoint is idempotent on the address -- so this is safe to run
 * more than once.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/apiAuth'
import { subscribeToMarketing } from '@/lib/klaviyo'
import { pendingSubscribers, markSynced, markFailed } from '@/lib/subscribers'

export async function GET() {
  const denied = await requireAdmin()
  if (denied) return denied

  const pending = await pendingSubscribers()
  return NextResponse.json({ pending, count: pending.length })
}

export async function POST() {
  const denied = await requireAdmin()
  if (denied) return denied

  const pending = await pendingSubscribers()
  let synced = 0
  const failed: { email: string; error: string | null }[] = []

  // One at a time on purpose: a burst of parallel requests to a provider that
  // is already refusing us is how a soft failure becomes a rate limit.
  for (const row of pending) {
    const accepted = await subscribeToMarketing(row.email, null, row.audience)
    if (accepted) {
      await markSynced(row.id)
      synced++
    } else {
      await markFailed(row.id, 'Retry rejected by Klaviyo')
      failed.push({ email: row.email, error: row.last_error })
    }
  }

  return NextResponse.json({ attempted: pending.length, synced, failed })
}
