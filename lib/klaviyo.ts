/**
 * Klaviyo marketing list. SERVER ONLY.
 *
 * Sent through Klaviyo's HTTP API rather than an SDK, for the same reason as
 * lib/email.ts: it is one POST, and a dependency that exists to build one POST
 * is a dependency to keep updated for no reason.
 *
 * Optional in exactly the same way as email. With either key unset every
 * subscribe quietly does nothing and says so in the log, and nothing here ever
 * throws -- a marketing provider being down or misconfigured must never cost
 * somebody their place in the league.
 *
 * Only ever called for people who ticked the box. The registration form says
 * "We only use your details to run the league", so a marketing list is a
 * second, separate thing somebody has to actively agree to. Nobody is added
 * because they registered.
 */

import 'server-only'

const KLAVIYO_ENDPOINT = 'https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/'

/**
 * Klaviyo pins breaking changes to a dated revision rather than a version in
 * the path. Bump this deliberately after reading their changelog, never
 * because something looked out of date.
 */
const API_REVISION = '2025-07-15'

/** Give up rather than hold a registration open on a slow provider. */
const TIMEOUT_MS = 5000

export function isKlaviyoConfigured(): boolean {
  return Boolean(process.env.KLAVIYO_PRIVATE_API_KEY && process.env.KLAVIYO_LIST_ID)
}

/**
 * Adds one email address to the configured list as a subscribed marketing
 * profile. Never throws and never rejects.
 *
 * `consentedAt` is recorded as the moment the box was ticked. Klaviyo keeps it
 * as the proof of opt-in, which is the thing you want on hand if anyone ever
 * asks why they are receiving mail.
 */
export async function subscribeToMarketing(
  email: string,
  name?: string | null,
  consentedAt: Date = new Date()
): Promise<void> {
  if (!isKlaviyoConfigured()) {
    console.info(`Klaviyo not configured; skipping subscribe for ${email}`)
    return
  }

  // Klaviyo wants a first/last split. Anything after the first space is the
  // surname, which is wrong for some names -- so it is only a convenience for
  // greeting someone, never used to identify them.
  const trimmed = (name ?? '').trim()
  const firstSpace = trimmed.indexOf(' ')
  const firstName = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)
  const lastName = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1)

  try {
    const response = await fetch(KLAVIYO_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Klaviyo-API-Key ${process.env.KLAVIYO_PRIVATE_API_KEY}`,
        revision: API_REVISION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          type: 'profile-subscription-bulk-create-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    email,
                    ...(firstName ? { first_name: firstName } : {}),
                    ...(lastName ? { last_name: lastName } : {}),
                    subscriptions: {
                      email: {
                        marketing: {
                          consent: 'SUBSCRIBED',
                          consented_at: consentedAt.toISOString(),
                        },
                      },
                    },
                  },
                },
              ],
            },
            historical_import: false,
          },
          relationships: {
            list: { data: { type: 'list', id: process.env.KLAVIYO_LIST_ID } },
          },
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) {
      // The body is logged in full: Klaviyo answers a malformed request with a
      // JSON:API pointer to the exact field, which is the only way to tell a
      // wrong list id from a wrong payload shape.
      console.error(
        `Klaviyo subscribe for ${email} rejected:`,
        response.status,
        await response.text().catch(() => '')
      )
    }
  } catch (error) {
    console.error(`Klaviyo subscribe for ${email} failed:`, error)
  }
}
