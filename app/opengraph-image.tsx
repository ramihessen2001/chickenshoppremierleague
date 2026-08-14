/**
 * The card that appears when the site is pasted into WhatsApp, Instagram,
 * iMessage or Slack.
 *
 * Generated rather than hand-drawn so it stays in step with `config/league.ts`:
 * change the season or the venue there and the share card follows. It is
 * deliberately season-agnostic in tone -- no "registration is open", which
 * would go stale the moment the phase changes and be cached by every chat app
 * that has already seen it.
 *
 * Next renders this once at build time and serves it as a static PNG.
 */

import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { LEAGUE } from '@/config/league'

export const alt = `${LEAGUE.name} — ${LEAGUE.fallbackSeason}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * The strap line. Written short by hand rather than pulled from the details
 * table: the full venue name wraps onto a second line at this size and pushes
 * the rule out of alignment.
 */
const STRAPLINE = 'Mondays & Wednesdays · ICNEF, Jacksonville'

export default async function OpengraphImage() {
  // Read from disk rather than by URL: at build time there is no server to
  // fetch from, and the crest is a local asset either way.
  const crest = readFileSync(join(process.cwd(), 'public', 'images', 'league_logo.svg'))
  const crestSrc = `data:image/svg+xml;base64,${crest.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#1d1d1f',
          color: '#ffffff',
          padding: '72px 80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* A plain <img>: next/image has no meaning inside an OG image.
              The crest is 3:4, so the box has to be too or it distorts. */}
          <img src={crestSrc} alt="" width={126} height={168} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                fontSize: 26,
                letterSpacing: 6,
                textTransform: 'uppercase',
                color: '#d47f7d',
              }}
            >
              {LEAGUE.shortName}
            </div>
            <div style={{ fontSize: 34, color: '#86868b' }}>
              {LEAGUE.fallbackSeason}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.05 }}>
            {LEAGUE.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 4, background: '#d47f7d' }} />
            {/* One string, not two nodes: the renderer behind ImageResponse
                requires an explicit display on any element with more than one
                child. */}
            <div style={{ fontSize: 32, color: '#d2d2d7' }}>{STRAPLINE}</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
