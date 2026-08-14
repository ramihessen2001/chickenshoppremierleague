/**
 * Transactional email. SERVER ONLY.
 *
 * Sent through Resend's HTTP API rather than an SDK: it is one POST, and a
 * dependency that exists to build one POST is a dependency to keep updated for
 * no reason.
 *
 * Email is *optional*. With RESEND_API_KEY or EMAIL_FROM unset, every send
 * quietly does nothing and says so in the server log. Registration must not
 * fail because a mail provider is down or unconfigured -- the player has a
 * place either way, and the confirmation panel already told them the details.
 */

import 'server-only'
import { LEAGUE } from '@/config/league'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** Give up rather than hold a registration open on a slow provider. */
const TIMEOUT_MS = 5000

interface Email {
  to: string
  subject: string
  /** Plain text. Also used as the HTML body, with newlines turned into breaks. */
  body: string
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/**
 * Sends an email, or does nothing if email is not configured. Never throws and
 * never rejects: callers are inside request handlers whose real work has
 * already succeeded.
 */
export async function sendEmail({ to, subject, body }: Email): Promise<void> {
  if (!isEmailConfigured()) {
    console.info(`Email not configured; skipping "${subject}" to ${to}`)
    return
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text: body,
        html: toHtml(body),
        ...(process.env.EMAIL_REPLY_TO
          ? { reply_to: process.env.EMAIL_REPLY_TO }
          : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error(
        `Email "${subject}" to ${to} rejected:`,
        response.status,
        await response.text().catch(() => '')
      )
    }
  } catch (error) {
    console.error(`Email "${subject}" to ${to} failed:`, error)
  }
}

/** Minimal HTML: the plain text in a readable column, links left as text. */
function toHtml(body: string): string {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return (
    `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;` +
    `font-size:15px;line-height:1.6;color:#1d1d1f;max-width:560px">` +
    escaped.replace(/\n/g, '<br>') +
    `</div>`
  )
}

/* -------------------------------------------------------------------------- */
/* Templates                                                                   */
/* -------------------------------------------------------------------------- */

const paymentBlock = LEAGUE.payment.methods
  .map(({ label, handle }) => `  ${label}: ${handle}`)
  .join('\n')

const signOff = `— ${LEAGUE.name}`

/**
 * Sent the moment someone registers. Its job is to put the payment details
 * somewhere the player still has them tomorrow.
 */
export function registrationEmail(name: string) {
  return {
    subject: `You're registered — ${LEAGUE.name}`,
    body:
      `Assalamu alaikum ${name},\n\n` +
      `You're registered for the ${LEAGUE.name} (${LEAGUE.fallbackSeason}).\n\n` +
      `One thing left: send the ${LEAGUE.payment.amount} sign-up fee using any of these:\n\n` +
      `${paymentBlock}\n\n` +
      `Your place is confirmed once the payment comes through, and we'll email ` +
      `you again to say so. Reply to this email if anything is unclear.\n\n` +
      `${signOff}`,
  }
}

/** Sent instead of the above when the roster was already full. */
export function waitlistEmail(name: string) {
  return {
    subject: `You're on the waitlist — ${LEAGUE.name}`,
    body:
      `Assalamu alaikum ${name},\n\n` +
      `Thanks for registering for the ${LEAGUE.name} (${LEAGUE.fallbackSeason}).\n\n` +
      `All ${LEAGUE.rosterCap} places are taken for this season, so you're on ` +
      `the waitlist. Please don't send the sign-up fee yet — we'll email you ` +
      `if a place opens up, and take payment then.\n\n` +
      `${signOff}`,
  }
}

/** Sent when an organiser marks the place confirmed, usually on payment. */
export function placeConfirmedEmail(name: string) {
  return {
    subject: `Your place is confirmed — ${LEAGUE.name}`,
    body:
      `Assalamu alaikum ${name},\n\n` +
      `We've received your sign-up fee and your place in the ` +
      `${LEAGUE.name} is confirmed.\n\n` +
      `Next up is the draft. We'll be in touch with your team and the fixture ` +
      `list before the season starts.\n\n` +
      `${signOff}`,
  }
}
