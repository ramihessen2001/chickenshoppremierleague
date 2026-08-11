/**
 * Supabase client with the service role key.
 *
 * SERVER ONLY. The service role key bypasses every RLS policy, so it must never
 * reach the browser. The `server-only` import below turns an accidental import
 * from a client component into a build error rather than a silent key leak.
 *
 * Note the env var has no NEXT_PUBLIC_ prefix -- that prefix is what inlines a
 * value into the client bundle, which is exactly what we are avoiding.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!serviceRoleKey) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY. Admin writes cannot work without it. ' +
      'Add it to .env.local (and to your hosting provider env vars).'
  )
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
