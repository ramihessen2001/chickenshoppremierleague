/**
 * Content desk session: login, logout, and status.
 *
 *   GET    -> { isMedia: boolean }  (may the caller use the desk? admins can too)
 *   POST   -> { password }          (log in, sets the signed httpOnly cookie)
 *   DELETE ->                       (log out, clears the cookie)
 *
 * Mirrors /api/statkeeper/session -- see lib/auth.ts for how the session token
 * itself is signed and verified.
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  MEDIA_COOKIE_NAME,
  createSessionToken,
  isAdminRequest,
  isMediaRequest,
  isValidMediaPassword,
  sessionCookieOptions,
} from '@/lib/auth'
import { fail, readJson } from '@/lib/apiAuth'

export async function GET() {
  return NextResponse.json({
    isMedia: (await isMediaRequest()) || (await isAdminRequest()),
  })
}

export async function POST(request: Request) {
  const body = await readJson<{ password?: string }>(request)
  if (!body) return fail('Invalid request body')

  if (!isValidMediaPassword(body.password)) {
    // Deliberately vague, and slowed slightly to blunt brute-force attempts.
    await new Promise((resolve) => setTimeout(resolve, 500))
    return fail('Incorrect password', 401)
  }

  const { token, expiresAt } = createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(MEDIA_COOKIE_NAME, token, sessionCookieOptions(expiresAt))

  return NextResponse.json({ isMedia: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(MEDIA_COOKIE_NAME, '', sessionCookieOptions())
  return NextResponse.json({ isMedia: false })
}
