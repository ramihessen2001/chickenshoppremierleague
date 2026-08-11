/**
 * Shared guard for admin API routes. SERVER ONLY.
 */

import 'server-only'
import { NextResponse } from 'next/server'
import { isAdminRequest } from './auth'

/**
 * Returns a 401 response if the caller is not an authenticated admin, or null
 * if the request may proceed. Call at the top of every admin route handler:
 *
 *   const denied = await requireAdmin()
 *   if (denied) return denied
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdminRequest()) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/** Consistent error shape for route handlers. */
export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Parses a JSON body, returning null when the body is absent or malformed. */
export async function readJson<T = Record<string, unknown>>(
  request: Request
): Promise<T | null> {
  try {
    return (await request.json()) as T
  } catch {
    return null
  }
}
