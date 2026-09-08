/**
 * The local record of who asked for league updates. SERVER ONLY.
 *
 * Written before Klaviyo is called, never after. The route used to keep
 * nothing, on the reasoning that the list was the record; that held until a
 * malformed payload was rejected for two days while the form said "You're on
 * the list", and the addresses were gone because Vercel's logs were the only
 * copy. A row here means a failed sync costs a retry rather than the address.
 *
 * Every function is best-effort and never throws. In particular none of them
 * may fail a subscribe: if this table does not exist yet -- the code can ship
 * before the migration is run -- recording is skipped and the Klaviyo call
 * still happens, which is exactly the old behaviour.
 */

import 'server-only'
import { supabaseAdmin } from './supabaseAdmin'
import type { KlaviyoAudience } from './klaviyo'

export interface PendingSubscriber {
  id: string
  email: string
  audience: KlaviyoAudience
  attempts: number
  created_at: string
  last_error: string | null
}

/**
 * A table that does not exist yet, reported two different ways: Postgres uses
 * 42P01, but PostgREST answers from its own schema cache and returns PGRST205
 * long before the query reaches Postgres.
 */
const MISSING_TABLE = ['42P01', 'PGRST205']

function warnUnlessMissingTable(context: string, error: { code?: string; message?: string }) {
  if (error.code && MISSING_TABLE.includes(error.code)) {
    console.warn(
      `subscribers table not created yet (run migration 025); ${context} skipped`
    )
    return
  }
  console.error(`subscribers: ${context} failed:`, error.message ?? error)
}

/**
 * Records an address as wanting this list, and returns the row id.
 *
 * Idempotent on (audience, lower(email)): somebody submitting twice updates
 * the row they already have rather than creating a second one, and does not
 * clear a sync that already succeeded.
 */
export async function recordSubscriber(
  email: string,
  audience: KlaviyoAudience,
  source = 'popup'
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .upsert(
      { email, audience, source },
      { onConflict: 'audience,email', ignoreDuplicates: false }
    )
    .select('id')
    .maybeSingle()

  if (error) {
    // The unique index is on lower(email), which PostgREST cannot name as a
    // conflict target, so a repeat address comes back as a duplicate-key
    // error rather than an update. That is fine -- the address is already
    // recorded, which is the whole point -- so find the existing row instead.
    if (error.code === '23505') return findSubscriber(email, audience)
    warnUnlessMissingTable('recording', error)
    return null
  }
  return data?.id ?? null
}

async function findSubscriber(
  email: string,
  audience: KlaviyoAudience
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .select('id')
    .eq('audience', audience)
    .ilike('email', email)
    .maybeSingle()
  if (error) {
    warnUnlessMissingTable('lookup', error)
    return null
  }
  return data?.id ?? null
}

/** Marks a row as accepted by Klaviyo, clearing any earlier failure. */
export async function markSynced(id: string | null): Promise<void> {
  if (!id) return
  const { error } = await supabaseAdmin
    .from('subscribers')
    .update({ synced_at: new Date().toISOString(), last_attempt_at: new Date().toISOString(), last_error: null })
    .eq('id', id)
  if (error) warnUnlessMissingTable('marking synced', error)
}

/**
 * Records that Klaviyo refused, leaving the row in the retry queue.
 *
 * `attempts` is incremented by reading it first rather than in SQL, which is
 * racy in principle; in practice one person submits one address at a time, and
 * a count being off by one is not worth a stored procedure.
 */
export async function markFailed(id: string | null, reason: string): Promise<void> {
  if (!id) return
  const { data } = await supabaseAdmin
    .from('subscribers')
    .select('attempts')
    .eq('id', id)
    .maybeSingle()

  const { error } = await supabaseAdmin
    .from('subscribers')
    .update({
      attempts: (data?.attempts ?? 0) + 1,
      last_attempt_at: new Date().toISOString(),
      last_error: reason.slice(0, 2000),
    })
    .eq('id', id)
  if (error) warnUnlessMissingTable('marking failed', error)
}

/** Everyone still waiting on Klaviyo, oldest first. */
export async function pendingSubscribers(limit = 200): Promise<PendingSubscriber[]> {
  const { data, error } = await supabaseAdmin
    .from('subscribers')
    .select('id, email, audience, attempts, created_at, last_error')
    .is('synced_at', null)
    .order('created_at')
    .limit(limit)
  if (error) {
    warnUnlessMissingTable('listing pending', error)
    return []
  }
  return (data ?? []) as PendingSubscriber[]
}
