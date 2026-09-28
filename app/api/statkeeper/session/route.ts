/**
 * Statkeeper session: login, logout, and status.
 *
 *   GET    -> { isStatkeeper: boolean }  (does the caller hold a valid session?)
 *   POST   -> { password }               (log in, sets the signed httpOnly cookie)
 *   DELETE ->                            (log out, clears the cookie)
 *
 * Mirrors /api/admin/session -- see that route and lib/auth.ts for how the
 * session token itself is signed and verified.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  STATKEEPER_COOKIE_NAME,
  createSessionToken,
  isStatkeeperRequest,
  isValidStatkeeperPassword,
  sessionCookieOptions,
} from '@/lib/auth'
import { fail, readJson } from '@/lib/apiAuth'

export async function GET() {
  return NextResponse.json({ isStatkeeper: await isStatkeeperRequest() })
}

export async function POST(request: Request) {
  const body = await readJson<{ password?: string }>(request)
  if (!body) return fail('Invalid request body')

  if (!isValidStatkeeperPassword(body.password)) {
    // Deliberately vague, and slowed slightly to blunt brute-force attempts.
    await new Promise((resolve) => setTimeout(resolve, 500))
    return fail('Incorrect password', 401)
  }

  const { token, expiresAt } = createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(STATKEEPER_COOKIE_NAME, token, sessionCookieOptions(expiresAt))

  return NextResponse.json({ isStatkeeper: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(STATKEEPER_COOKIE_NAME, '', sessionCookieOptions())
  return NextResponse.json({ isStatkeeper: false })
}
