/**
 * Draws a graphic spec as a 1080x1440 PNG. SERVER ONLY.
 *
 * The four templates designed on the canvas (Team of the Week, League Table,
 * Stat Leaders, Matchweek Slate), rebuilt for next/og -- the same renderer as
 * the share card in app/opengraph-image.tsx. Its layout engine is flexbox
 * only: no grid, and every element with more than one child is a flex box.
 *
 * PURO, as on the site: Plex Condensed bold for names (italic for section
 * titles), Courier Prime for every label and figure, rules instead of boxes,
 * square corners. On black the one accent is wash; on bone it is court, since
 * wash is never type on a light ground.
 *
 * Fonts and crests are read from assets/ (bundled into the function by
 * outputFileTracingIncludes in next.config.ts). The crests there are the
 * team SVGs with their <style> blocks inlined as attributes, because the
 * renderer ignores <style> inside an image.
 */

import 'server-only'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReactNode } from 'react'
import { ImageResponse } from 'next/og'
import {
  GraphicSpec,
  Ground,
  SlateGraphic,
  StatLeadersGraphic,
  TableGraphic,
  TotwGraphic,
} from './spec'

const WIDTH = 1080
const HEIGHT = 1440

interface Theme {
  bg: string
  ink: string
  ink2: string
  rule: string
  heavy: string
  accent: string
}

const THEMES: Record<Ground, Theme> = {
  black: { bg: '#0d0d0d', ink: '#efede8', ink2: '#9a958c', rule: '#2a2a2a', heavy: '#efede8', accent: '#a5c6cf' },
  bone: { bg: '#efede8', ink: '#0d0d0d', ink2: '#55524c', rule: '#cfcac1', heavy: '#0d0d0d', accent: '#3d6b85' },
}

const DISPLAY = 'Plex Condensed'
const UTIL = 'Courier Prime'

const ASSETS = join(process.cwd(), 'assets')

type Fonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>['fonts']
let fonts: Fonts

function loadFonts(): Fonts {
  if (!fonts) {
    const font = (file: string) => readFileSync(join(ASSETS, 'fonts', file))
    fonts = [
      { name: DISPLAY, data: font('IBMPlexSansCondensed-Bold.ttf'), weight: 700, style: 'normal' },
      { name: DISPLAY, data: font('IBMPlexSansCondensed-BoldItalic.ttf'), weight: 700, style: 'italic' },
      { name: UTIL, data: font('CourierPrime-Regular.ttf'), weight: 400, style: 'normal' },
      { name: UTIL, data: font('CourierPrime-Bold.ttf'), weight: 700, style: 'normal' },
    ]
  }
  return fonts
}

/** Crest SVGs as data URIs with their aspect ratio, read once per slug. */
const crestCache = new Map<string, { src: string; ratio: number } | null>()

function crestData(slug: string) {
  if (!crestCache.has(slug)) {
    try {
      const svg = readFileSync(join(ASSETS, 'crests', `${slug}.svg`), 'utf8')
      const box = svg.match(/viewBox="([\d.\s-]+)"/)?.[1].trim().split(/\s+/).map(Number)
      const ratio = box && box[2] > 0 && box[3] > 0 ? box[2] / box[3] : 1
      crestCache.set(slug, {
        src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
        ratio,
      })
    } catch {
      crestCache.set(slug, null)
    }
  }
  return crestCache.get(slug) ?? null
}

/** A crest fitted inside a box, keeping its proportions. */
function Crest({ slug, box }: { slug: string; box: number }) {
  const crest = crestData(slug)
  if (!crest) return <div style={{ display: 'flex', width: box, height: box }} />
  const width = crest.ratio >= 1 ? box : Math.round(box * crest.ratio)
  const height = crest.ratio >= 1 ? Math.round(box / crest.ratio) : box
  return (
    <div style={{ display: 'flex', width: box, height: box, alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
      <img src={crest.src} width={width} height={height} alt="" />
    </div>
  )
}

function siteHost(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'https://chickenshoppremierleague.vercel.app'
  try {
    return new URL(url).host
  } catch {
    return 'chickenshoppremierleague.vercel.app'
  }
}

function Frame({
  t,
  season,
  kicker,
  title,
  footerRight = 'ICNEF · Jacksonville',
  children,
}: {
  t: Theme
  season: string
  kicker: string
  title: string
  footerRight?: string
  children: ReactNode
}) {
  return (
    <div
      style={{
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 72px 56px',
        background: t.bg,
        color: t.ink,
        fontFamily: UTIL,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, paddingBottom: 28, borderBottom: `5px solid ${t.heavy}` }}>
        <Crest slug="cspl" box={100} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1 }}>
          <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, lineHeight: 1, textTransform: 'uppercase' }}>
            YM Chicken Shop Premier League
          </div>
          <div style={{ fontSize: 21, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>{season}</div>
        </div>
        <div style={{ fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', color: t.accent }}>{kicker}</div>
      </div>

      <div
        style={{
          marginTop: 40,
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontStyle: 'italic',
          fontSize: 108,
          lineHeight: 0.94,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>

      {children}

      <div
        style={{
          marginTop: 'auto',
          paddingTop: 22,
          borderTop: `2px solid ${t.rule}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 20,
          letterSpacing: 1.5,
          color: t.ink2,
        }}
      >
        <div>{siteHost()}</div>
        <div style={{ textTransform: 'uppercase' }}>{footerRight}</div>
      </div>
    </div>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
const afterWeekLabel = (week: number | null) => (week ? `After Matchweek ${pad(week)}` : 'Pre-season')
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '0')

function Table({ spec, t }: { spec: TableGraphic; t: Theme }) {
  const numeric = ['GP', 'W', 'D', 'L', 'GF', 'GA', 'GD']
  const cell = { width: 56, display: 'flex', justifyContent: 'flex-end' } as const
  const rowHeight = Math.min(98, Math.floor(790 / Math.max(spec.rows.length, 1)))
  return (
    <Frame t={t} season={spec.season} kicker={afterWeekLabel(spec.afterWeek)} title="League Table">
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            paddingBottom: 14,
            borderBottom: `5px solid ${t.heavy}`,
            fontSize: 19,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: t.ink2,
          }}
        >
          <div style={{ width: 56, display: 'flex' }}>#</div>
          <div style={{ flexGrow: 1, display: 'flex' }}>Club</div>
          {numeric.map((label) => (
            <div key={label} style={cell}>
              {label}
            </div>
          ))}
          <div style={{ width: 84, display: 'flex', justifyContent: 'flex-end' }}>Pts</div>
        </div>

        {spec.rows.map((row) => (
          <div
            key={row.club.slug}
            style={{
              display: 'flex',
              alignItems: 'center',
              height: rowHeight,
              borderBottom: `2px solid ${t.rule}`,
              fontSize: 28,
            }}
          >
            <div style={{ width: 56, display: 'flex', color: t.ink2 }}>{row.position}</div>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 18 }}>
              <Crest slug={row.club.slug} box={58} />
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 31, textTransform: 'uppercase' }}>
                {row.club.name}
              </div>
            </div>
            {[row.played, row.won, row.drawn, row.lost, row.goalsFor, row.goalsAgainst].map((value, i) => (
              <div key={i} style={cell}>
                {value}
              </div>
            ))}
            <div style={cell}>{signed(row.goalDifference)}</div>
            <div style={{ width: 84, display: 'flex', justifyContent: 'flex-end', fontWeight: 700, fontSize: 34 }}>
              {row.points}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26, fontSize: 18, lineHeight: 1.5, letterSpacing: 1, textTransform: 'uppercase', color: t.ink2 }}>
        GP played · W won · D drawn · L lost · GF goals for · GA goals against · GD goal difference · Pts 3 for a win, 1 for
        a draw
      </div>
    </Frame>
  )
}

function StatLeaders({ spec, t }: { spec: StatLeadersGraphic; t: Theme }) {
  return (
    <Frame t={t} season={spec.season} kicker={afterWeekLabel(spec.afterWeek)} title="Stat Leaders">
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 20 }}>
        {spec.categories.map((category, ci) => {
          const [leader, ...rest] = category.rows
          return (
            <div
              key={category.label}
              style={{
                display: 'flex',
                gap: 48,
                padding: '26px 0',
                height: 322,
                borderBottom: ci < spec.categories.length - 1 ? `2px solid ${t.rule}` : 'none',
              }}
            >
              <div style={{ width: 330, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: 44,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    color: t.accent,
                  }}
                >
                  {category.label}
                </div>
                {leader ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 124, lineHeight: 0.82 }}>{leader.total}</div>
                    <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, lineHeight: 1, textTransform: 'uppercase' }}>
                      {leader.player}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Crest slug={leader.club.slug} box={34} />
                      <div style={{ fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase', color: t.ink2 }}>
                        {leader.club.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 22, color: t.ink2 }}>None recorded yet</div>
                )}
              </div>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {rest.map((row, ri) => (
                  <div
                    key={`${row.player}-${ri}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      height: 62,
                      borderBottom: ri < rest.length - 1 ? `2px solid ${t.rule}` : 'none',
                    }}
                  >
                    <div style={{ width: 48, display: 'flex', fontSize: 24, color: t.ink2 }}>{row.rank}</div>
                    <Crest slug={row.club.slug} box={40} />
                    <div style={{ flexGrow: 1, display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 29, textTransform: 'uppercase' }}>
                      {row.player}
                    </div>
                    <div style={{ width: 64, display: 'flex', justifyContent: 'flex-end', fontWeight: 700, fontSize: 30 }}>
                      {row.total}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Frame>
  )
}

function Slate({ spec, t }: { spec: SlateGraphic; t: Theme }) {
  const gameCount = spec.days.reduce((n, d) => n + d.games.length, 0)
  const rowHeight = gameCount <= 4 ? 188 : Math.max(120, Math.floor(820 / gameCount))
  const crest = rowHeight >= 160 ? 92 : 72

  // Both sides face the "v": the home crest sits right of its name, the away
  // crest left of its name.
  const team = (club: SlateGraphic['days'][number]['games'][number]['home'], align: 'left' | 'right') => {
    const name = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 34,
            lineHeight: 1,
            textTransform: 'uppercase',
            textAlign: align,
            maxWidth: 240,
          }}
        >
          {club.name}
        </div>
        {club.standing && (
          <div style={{ fontSize: 19, letterSpacing: 1.5, textTransform: 'uppercase', color: t.ink2 }}>{club.standing}</div>
        )}
      </div>
    )
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {align === 'right' ? name : <Crest slug={club.slug} box={crest} />}
        {align === 'right' ? <Crest slug={club.slug} box={crest} /> : name}
      </div>
    )
  }

  return (
    <Frame
      t={t}
      season={spec.season}
      kicker="This Weekend"
      title={`Matchweek ${pad(spec.week)}`}
      footerRight={spec.venue.includes('ICNEF') ? 'ICNEF · 2333 St Johns Bluff Rd S' : spec.venue}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 44, marginTop: 48 }}>
        {spec.days.map((day) => (
          <div key={day.date} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: 14,
                borderBottom: `5px solid ${t.heavy}`,
              }}
            >
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1, textTransform: 'uppercase' }}>
                {day.weekday}
              </div>
              <div style={{ fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>{day.date}</div>
            </div>
            {day.games.map((game, gi) => (
              <div
                key={gi}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: rowHeight,
                  borderBottom: gi < day.games.length - 1 ? `2px solid ${t.rule}` : 'none',
                }}
              >
                <div style={{ width: 150, display: 'flex', fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', color: t.accent }}>
                  {game.slot}
                </div>
                {team(game.home, 'right')}
                <div style={{ width: 56, display: 'flex', justifyContent: 'center', fontSize: 24, color: t.ink2 }}>v</div>
                {team(game.away, 'left')}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  )
}

/** Where each pitch spot sits, as the marker's centre within the 936-wide pitch. */
const SPOTS: { x: number; y: number }[] = [
  { x: 468, y: 30 }, // FWD
  { x: 234, y: 205 }, // MID
  { x: 702, y: 205 }, // MID
  { x: 234, y: 390 }, // DEF
  { x: 702, y: 390 }, // DEF
  { x: 468, y: 560 }, // GK
]

function Totw({ spec, t }: { spec: TotwGraphic; t: Theme }) {
  const line = { position: 'absolute', border: `3px solid ${t.rule}` } as const
  const potw = spec.playerOfTheWeek
  return (
    <Frame t={t} season={spec.season} kicker={`Matchweek ${pad(spec.week)}`} title="Team of the Week">
      <div style={{ position: 'relative', display: 'flex', height: 740, marginTop: 36, border: `3px solid ${t.rule}` }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 367, height: 0, borderTop: `3px solid ${t.rule}` }} />
        <div style={{ ...line, left: 375, top: 277, width: 180, height: 180, borderRadius: 90 }} />
        <div style={{ ...line, left: 235, top: -3, width: 460, height: 150, borderTop: 'none' }} />
        <div style={{ ...line, left: 355, top: -3, width: 220, height: 56, borderTop: 'none' }} />
        <div style={{ ...line, left: 235, bottom: -3, width: 460, height: 150, borderBottom: 'none' }} />
        <div style={{ ...line, left: 355, bottom: -3, width: 220, height: 56, borderBottom: 'none' }} />

        {spec.picks.map((pick, i) => (
          <div
            key={`${pick.player}-${i}`}
            style={{
              position: 'absolute',
              left: SPOTS[i].x - 160,
              top: SPOTS[i].y,
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Crest slug={pick.club.slug} box={84} />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                background: t.bg,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontFamily: DISPLAY,
                  fontWeight: 700,
                  fontSize: 34,
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  maxWidth: 300,
                }}
              >
                {pick.player}
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase', color: t.ink2 }}>
                <div>{pick.club.name}</div>
                {pick.statLine && <div style={{ display: 'flex', color: t.accent }}>{pick.statLine}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Crest slug={potw.club.slug} box={104} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', fontSize: 20, letterSpacing: 2.4, textTransform: 'uppercase', color: t.accent }}>Player of the Week</div>
            <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, lineHeight: 0.95, textTransform: 'uppercase', maxWidth: 520 }}>
              {potw.player}
            </div>
            <div style={{ display: 'flex', fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase', color: t.ink2 }}>
              {potw.position ? `${potw.club.name} · ${potw.position}` : potw.club.name}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 40 }}>
          {potw.stats.map((stat) => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 88, lineHeight: 0.85 }}>{stat.value}</div>
              <div style={{ display: 'flex', fontSize: 18, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  )
}

function Graphic({ spec, t }: { spec: GraphicSpec; t: Theme }) {
  switch (spec.type) {
    case 'table':
      return <Table spec={spec} t={t} />
    case 'stat_leaders':
      return <StatLeaders spec={spec} t={t} />
    case 'slate':
      return <Slate spec={spec} t={t} />
    case 'totw':
      return <Totw spec={spec} t={t} />
  }
}

/** The PNG for a spec. `headers` are added to the response (caching, download name). */
export function renderGraphic(
  spec: GraphicSpec,
  ground: Ground,
  headers?: Record<string, string>
): ImageResponse {
  return new ImageResponse(<Graphic spec={spec} t={THEMES[ground]} />, {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadFonts(),
    headers,
  })
}
