/**
 * Admin session handling.
 *
 * SERVER ONLY.
 *
 * The old build compared the admin password inside a React component, which
 * meant the password shipped in the client bundle and the "admin" flag lived in
 * sessionStorage where anyone could set it. Nothing actually protected the
 * database.
 *
 * Now: the password is checked on the server, and a successful check issues an
 * HMAC-signed, httpOnly cookie. Every admin API route verifies that cookie
 * before touching Supabase. The browser can flip its own UI state all it likes;
 * without a valid signed cookie no write is possible.
 */

import 'server-only'
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'cspl_admin'

/** How long a login lasts before the admin has to re-enter the password. */
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'ADMIN_SESSION_SECRET must be set to a random string of at least 32 ' +
        'characters. Generate one with: openssl rand -hex 32'
    )
  }
  return secret
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('ADMIN_PASSWORD is not set. Admin login cannot work without it.')
  }
  return password
}

/** Constant-time string comparison that tolerates differing lengths. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHmac('sha256', 'compare').update(a).digest()
  const hb = createHmac('sha256', 'compare').update(b).digest()
  return timingSafeEqual(ha, hb)
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

/**
 * Checks a submitted password against ADMIN_PASSWORD.
 */
export function isValidPassword(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || candidate.length === 0) return false
  return safeEqual(candidate, getAdminPassword())
}

/**
 * Builds a signed session token of the form `<expiry>.<nonce>.<signature>`.
 */
export function createSessionToken(): { token: string; expiresAt: Date } {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const nonce = randomBytes(16).toString('hex')
  const payload = `${expiresAt.getTime()}.${nonce}`
  return { token: `${payload}.${sign(payload)}`, expiresAt }
}

/**
 * Verifies a session token's signature and expiry.
 */
export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  const [expiry, nonce, signature] = parts
  const payload = `${expiry}.${nonce}`

  if (!safeEqual(signature, sign(payload))) return false

  const expiresAt = Number(expiry)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false

  return true
}

/**
 * Reads the session cookie and reports whether the caller is an authenticated
 * admin. Use this at the top of every admin route handler.
 */
export async function isAdminRequest(): Promise<boolean> {
  const cookieStore = await cookies()
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value)
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME

/** Cookie options shared by the login and logout routes. */
export function sessionCookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(expiresAt ? { expires: expiresAt } : { maxAge: 0 }),
  }
}
