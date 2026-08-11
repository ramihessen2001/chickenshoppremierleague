/**
 * Admin session: login, logout, and status.
 *
 *   GET    -> { isAdmin: boolean }   (does the caller hold a valid session?)
 *   POST   -> { password }           (log in, sets the signed httpOnly cookie)
 *   DELETE ->                        (log out, clears the cookie)
 */

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  isAdminRequest,
  isValidPassword,
  sessionCookieOptions,
} from '@/lib/auth'
import { fail, readJson } from '@/lib/apiAuth'

export async function GET() {
  return NextResponse.json({ isAdmin: await isAdminRequest() })
}

export async function POST(request: Request) {
  const body = await readJson<{ password?: string }>(request)
  if (!body) return fail('Invalid request body')

  if (!isValidPassword(body.password)) {
    // Deliberately vague, and slowed slightly to blunt brute-force attempts.
    await new Promise((resolve) => setTimeout(resolve, 500))
    return fail('Incorrect password', 401)
  }

  const { token, expiresAt } = createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, token, sessionCookieOptions(expiresAt))

  return NextResponse.json({ isAdmin: true })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, '', sessionCookieOptions())
  return NextResponse.json({ isAdmin: false })
}
