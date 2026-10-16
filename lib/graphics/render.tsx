/**
 * Draws a graphic spec as a PNG (1080x1440 posts, 1080x1920 stories). SERVER ONLY.
 *
 * The four templates designed on the canvas (Team of the Week, League Table,
 * Stat Leaders, Matchweek Slate), rebuilt for next/og -- the same renderer as
 * the share card in app/opengraph-image.tsx. Its layout engine is flexbox
 * only: no grid, and every element with more than one child is a flex box.
 *
 * Every visual choice that may vary -- palette, texture, title treatment,
 * rule weights, rows drawn as rules or as bars, crest scale -- comes from the chosen style (lib/graphics/
 * styles.ts), PURO by default. What may not vary is fixed here: Plex
 * Condensed and Courier Prime, the league crest and name in the masthead,
 * the footer URL, and the club crests themselves.
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
  GRAPHIC_SIZES,
  GraphicSpec,
  Ground,
  MatchdayGraphic,
  PowerRankingsGraphic,
  SlateGraphic,
  StatLeadersGraphic,
  TableGraphic,
  TotwGraphic,
} from './spec'
import { Sponsor, SPONSORS, sponsorOf } from './sponsors'
import { GraphicStyle, groundFor, resolveStyle, StylePalette } from './styles'

const WIDTH = 1080
const HEIGHT = 1440

/**
 * What every template draws with: the chosen style's palette for the chosen
 * background, plus the style's non-colour choices flattened in for brevity.
 */
interface Theme extends StylePalette {
  style: GraphicStyle
  /** Heavy and light rule widths, px. */
  heavyW: number
  lightW: number
  /** A club crest's size scaled by the style. */
  crest: (box: number) => number
  /** Rows drawn as filled bars rather than type over rules. */
  bars: boolean
  /**
   * The sponsor strip is on and the title is still a bar of its own, so the
   * content below has to give up some height. (With the title in the header
   * band, that height is already saved.)
   */
  compact: boolean
  /** CSS backgrounds for bars and "v" chips: a sheen when glossy, else flat. */
  barFill: string
  chipFill: string
  radius: number
  /** The plate a crest sits on inside a bar; undefined when rows are rules. */
  plate: { bg: string; radius: number } | undefined
}

function makeTheme(style: GraphicStyle, ground: Ground): Theme {
  const palette = style.palettes[groundFor(style, ground)]
  const fill = (from: string, to: string) =>
    style.gloss ? `linear-gradient(180deg, ${from} 0%, ${to} 100%)` : to
  return {
    ...palette,
    style,
    heavyW: style.rules.heavy,
    lightW: style.rules.light,
    crest: (box) => Math.round(box * style.crestScale),
    bars: style.rows === 'bars',
    compact: style.sponsorFooter && style.header !== 'bandTitle' && style.header !== 'bandPill',
    barFill: fill(palette.barFrom, palette.barTo),
    chipFill: fill(palette.chipFrom, palette.chipTo),
    radius: style.radius,
    plate:
      style.rows === 'bars' && style.crestPlates
        ? { bg: palette.plateBg ?? palette.figureBg, radius: Math.min(style.radius, 6) }
        : undefined,
  }
}

/** A bar row's surface: the bar colours, or the highlight colours for the leader. */
function barSurface(t: Theme, highlight = false) {
  return {
    background: highlight ? t.highlightBg : t.barFill,
    color: highlight ? t.highlightInk : t.barInk,
    borderRadius: t.radius,
  }
}

/** The red-"v" chip between two clubs. */
function VChip({ t, width, height, fontSize }: { t: Theme; width: number; height: number; fontSize: number }) {
  return (
    <div
      style={{
        display: 'flex',
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
        background: t.chipFill,
        color: t.chipInk,
        borderRadius: Math.min(t.radius, 8),
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize,
        textTransform: 'lowercase',
      }}
    >
      v
    </div>
  )
}

/** The box that holds a bar row's key figure; inverted on the highlighted row. */
function FigureBox({
  t,
  value,
  width,
  height,
  fontSize,
  inverse = false,
}: {
  t: Theme
  value: string | number
  width: number
  height: number
  fontSize: number
  inverse?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        width,
        height,
        alignItems: 'center',
        justifyContent: 'center',
        background: inverse ? t.barFill : t.figureBg,
        color: inverse ? t.barInk : t.figureInk,
        borderRadius: Math.min(t.radius, 6),
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize,
      }}
    >
      {value}
    </div>
  )
}

/** The style's background: its colour or gradient, with the texture laid over it. */
function groundStyle(t: Theme) {
  const pattern = texturePattern(t)
  if (!t.bgTo || t.bgTo === t.bg) return pattern
  // A gradient ground goes under the texture as a second background layer.
  const gradient = `linear-gradient(180deg, ${t.bg} 0%, ${t.bgTo} 100%)`
  return {
    backgroundColor: t.bg,
    backgroundImage: pattern.backgroundImage ? `${pattern.backgroundImage}, ${gradient}` : gradient,
    ...(pattern.backgroundSize ? { backgroundSize: `${pattern.backgroundSize}, 100% 100%` } : {}),
  }
}

function texturePattern(t: Theme): { backgroundColor: string; backgroundImage?: string; backgroundSize?: string } {
  const c = t.texture
  switch (t.style.texture) {
    case 'spotlight':
      return {
        backgroundColor: t.bg,
        // A top-down sheen rather than a radial glow: the renderer misplaces
        // radial gradients once they are layered over a gradient ground.
        backgroundImage: `linear-gradient(180deg, ${c} 0%, transparent 38%)`,
      }
    case 'diagonal':
      return {
        backgroundColor: t.bg,
        backgroundImage: `repeating-linear-gradient(45deg, ${c} 0px, ${c} 3px, transparent 3px, transparent 26px)`,
      }
    case 'pinstripe':
      return {
        backgroundColor: t.bg,
        backgroundImage: `repeating-linear-gradient(90deg, ${c} 0px, ${c} 2px, transparent 2px, transparent 30px)`,
      }
    case 'grid':
      return {
        backgroundColor: t.bg,
        backgroundImage: `linear-gradient(${c} 2px, transparent 2px), linear-gradient(90deg, ${c} 2px, transparent 2px)`,
        backgroundSize: '54px 54px',
      }
    case 'dots':
      return {
        backgroundColor: t.bg,
        backgroundImage: `radial-gradient(circle, ${c} 3px, transparent 3.5px)`,
        backgroundSize: '26px 26px',
      }
    default:
      return { backgroundColor: t.bg }
  }
}

/** The accent strip across the top edge, when the style has one. */
function AccentBar({ t }: { t: Theme }) {
  if (t.style.accentBar <= 0) return null
  return (
    <div
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: t.style.accentBar, background: t.accent }}
    />
  )
}

/** A section title (LEAGUE TABLE, MATCHDAY...), set the way the style says. */
function Title({
  text,
  size,
  t,
  marginTop,
  lineHeight = 0.94,
  kicker,
}: {
  text: string
  size: number
  t: Theme
  marginTop: number
  lineHeight?: number
  /** The matchweek line; in the 'tab' header it sits on the banner's corner. */
  kicker?: string
}) {
  if (t.style.header === 'bandTitle' || t.style.header === 'bandPill') return null
  const { italic, scale, align, treatment } = t.style.title
  const band = treatment === 'band'
  if (treatment === 'banner') {
    const tab = t.style.header === 'tab' && kicker
    const corner = Math.min(t.radius, 8)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, marginTop: tab ? marginTop - 12 : marginTop, alignSelf: 'stretch' }}>
        {tab && (
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              padding: '12px 26px 8px',
              background: t.figureBg,
              color: t.figureInk,
              borderRadius: `${corner}px ${corner}px 0 0`,
              fontSize: 22,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: align === 'center' ? 'center' : 'flex-start',
            padding: '20px 30px 12px',
            ...barSurface(t),
            ...(tab ? { borderTopLeftRadius: 0 } : {}),
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontStyle: italic ? 'italic' : 'normal',
            fontSize: Math.round(size * scale),
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {text}
        </div>
      </div>
    )
  }
  return (
    <div
      style={{
        display: 'flex',
        flexShrink: 0,
        marginTop,
        alignSelf: align === 'center' ? 'center' : 'flex-start',
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontStyle: italic ? 'italic' : 'normal',
        fontSize: Math.round(size * scale),
        lineHeight: band ? 1 : lineHeight,
        textTransform: 'uppercase',
        textAlign: align,
        color: band ? t.onAccent : t.ink,
        background: band ? t.accent : 'transparent',
        padding: band ? '10px 22px 4px' : treatment === 'underline' ? '0 0 14px' : 0,
        borderBottom: treatment === 'underline' ? `${Math.max(t.heavyW, 6)}px solid ${t.accent}` : 'none',
      }}
    >
      {text}
    </div>
  )
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

/** SVGs from assets/ as data URIs with their aspect ratio, read once per file. */
const imageCache = new Map<string, { src: string; ratio: number } | null>()

function assetImage(dir: 'crests' | 'sponsors', file: string) {
  const key = `${dir}/${file}`
  if (!imageCache.has(key)) {
    try {
      const bytes = readFileSync(join(ASSETS, dir, file))
      let ratio = 1
      let mime = 'image/svg+xml'
      if (file.endsWith('.png')) {
        // A PNG states its size in the header: width and height, 4 bytes each, from byte 16.
        mime = 'image/png'
        ratio = bytes.readUInt32BE(16) / bytes.readUInt32BE(20)
      } else {
        const box = bytes.toString('utf8').match(/viewBox="([\d.\s-]+)"/)?.[1].trim().split(/\s+/).map(Number)
        ratio = box && box[2] > 0 && box[3] > 0 ? box[2] / box[3] : 1
      }
      imageCache.set(key, { src: `data:${mime};base64,${bytes.toString('base64')}`, ratio })
    } catch {
      imageCache.set(key, null)
    }
  }
  return imageCache.get(key) ?? null
}

const crestData = (slug: string) => assetImage('crests', `${slug}.svg`)

/**
 * A crest fitted inside a box, keeping its proportions. With `plate`, it sits
 * on a light plate inside the box: on a coloured bar, crests drawn in the
 * same colour (a navy laurel on a navy bar) would otherwise vanish, and the
 * crest itself is never recoloured.
 */
function Crest({ slug, box, plate }: { slug: string; box: number; plate?: { bg: string; radius: number } }) {
  const crest = crestData(slug)
  if (!crest) return <div style={{ display: 'flex', width: box, height: box }} />
  const inner = plate ? box - Math.round(box * 0.16) : box
  const width = crest.ratio >= 1 ? inner : Math.round(inner * crest.ratio)
  const height = crest.ratio >= 1 ? Math.round(inner / crest.ratio) : inner
  return (
    <div
      style={{
        display: 'flex',
        width: box,
        height: box,
        alignItems: 'center',
        justifyContent: 'center',
        ...(plate ? { background: plate.bg, borderRadius: plate.radius } : {}),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
      <img src={crest.src} width={width} height={height} alt="" />
    </div>
  )
}

/** A sponsor's logo fitted inside a box, keeping its proportions. It sits straight on the background. */
function SponsorLogo({ sponsor, width, height }: { sponsor: Sponsor; width: number; height: number }) {
  const logo = assetImage('sponsors', sponsor.file)
  if (!logo) return <div style={{ display: 'flex', width, height }} />
  const fitWidth = Math.min(width, Math.round(height * logo.ratio))
  const fitHeight = Math.round(fitWidth / logo.ratio)
  return (
    <div style={{ display: 'flex', width, height, alignItems: 'center', justifyContent: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
      <img src={logo.src} width={fitWidth} height={fitHeight} alt="" />
    </div>
  )
}

/**
 * All eight sponsors in one row above the footer URL, on a single bar in the
 * style's bar colours. The bar is one block behind the whole row: no logo has a
 * background of its own. Each logo gets an equal cell and sits in the middle of
 * it, so the row is centred between the margins whatever shape the logos are.
 */
function SponsorStrip({ t }: { t: Theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 92, marginBottom: 22, padding: '0 6px', ...barSurface(t) }}>
      {SPONSORS.map((sponsor) => (
        <div key={sponsor.slug} style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
          <SponsorLogo sponsor={sponsor} width={104} height={64} />
        </div>
      ))}
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

/**
 * The masthead: league crest, league name, and the kicker (matchweek line).
 * `bleedTop` is the padding above it to reach the graphic's top edge, so the
 * 'band' header can run edge to edge; the matchday story passes 0 because its
 * top 250px is left clear of Instagram's own controls.
 */
function Masthead({
  t,
  season,
  kicker,
  bleedTop,
  title,
  titleSize,
}: {
  t: Theme
  season: string
  kicker: string
  bleedTop: number
  /** The graphic's title and its size, for the headers that carry it. */
  title: string
  titleSize: number
}) {
  const withTitle = t.style.header === 'bandTitle' || t.style.header === 'bandPill'
  const band = t.style.header === 'band' || withTitle
  const name = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1 }}>
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 700,
          // The band's chip needs the room, so its league name is a touch smaller.
          fontSize: band ? 28 : 30,
          lineHeight: 1,
          textTransform: 'uppercase',
        }}
      >
        YM Chicken Shop Premier League
      </div>
      {t.style.showSeason && (
        <div style={{ display: 'flex', fontSize: 21, letterSpacing: 2, textTransform: 'uppercase', color: band ? t.barInk2 : t.ink2 }}>
          {season}
        </div>
      )}
    </div>
  )

  const chip = (
    <div
      style={{
        display: 'flex',
        flexShrink: 0,
        // Courier Prime is monospaced, so the chip's width follows from the text:
        // 22px type is 13.2px a letter plus 2px of spacing. Left to size itself
        // it wraps the matchweek onto two lines.
        width: Math.ceil(kicker.length * 15.2) + 44,
        justifyContent: 'center',
        padding: '14px 0 10px',
        background: t.chipFill,
        color: t.chipInk,
        borderRadius: Math.min(t.radius, 8),
        fontSize: 22,
        letterSpacing: 2,
        textTransform: 'uppercase',
      }}
    >
      {kicker}
    </div>
  )

  if (withTitle) {
    const pill = t.style.header === 'bandPill' ? assetImage('crests', 'csplpill.svg') : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'stretch', margin: `${-bleedTop}px -72px 0` }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: `${bleedTop > 0 ? 40 : 28}px 72px 30px`,
            background: t.barFill,
            color: t.barInk,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            {pill ? (
              <div style={{ display: 'flex', flexGrow: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
                <img src={pill.src} width={Math.round(84 * pill.ratio)} height={84} alt="" />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexGrow: 1 }}>
                <Crest slug="cspl" box={88} />
                <div
                  style={{
                    display: 'flex',
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontSize: 30,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  YM Chicken Shop Premier League
                </div>
              </div>
            )}
            {chip}
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: Math.round(titleSize * 0.9),
              lineHeight: 0.95,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: 'flex', height: 8, background: t.accent }} />
      </div>
    )
  }

  if (band) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'stretch', margin: `${-bleedTop}px -72px 0` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            padding: `${bleedTop > 0 ? 34 : 26}px 72px 26px`,
            background: t.barFill,
            color: t.barInk,
          }}
        >
          <Crest slug="cspl" box={104} />
          {name}
          {chip}
        </div>
        <div style={{ display: 'flex', height: 8, background: t.accent }} />
      </div>
    )
  }

  // The title tab drops the rule under the masthead and gives its room to a
  // bigger crest and league name.
  const tab = t.style.header === 'tab'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: tab ? 28 : 24,
        ...(tab ? {} : { paddingBottom: 28, borderBottom: `${t.heavyW}px solid ${t.heavy}` }),
      }}
    >
      <Crest slug="cspl" box={tab ? 124 : 100} />
      {tab ? (
        <div style={{ display: 'flex', flexGrow: 1, flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1, textTransform: 'uppercase' }}>
            YM Chicken Shop Premier League
          </div>
          {t.style.showSeason && (
            <div style={{ display: 'flex', fontSize: 21, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>{season}</div>
          )}
        </div>
      ) : (
        name
      )}
      {/* The YM Soccer badge, at the right-hand end of the masthead. */}
      {tab && <Crest slug="ymsoccer" box={104} />}
      {!tab && (
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', color: t.accent }}>{kicker}</div>
      )}
    </div>
  )
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
        position: 'relative',
        padding: '64px 72px 56px',
        ...groundStyle(t),
        color: t.ink,
        fontFamily: UTIL,
      }}
    >
      <AccentBar t={t} />
      <Masthead t={t} season={season} kicker={kicker} bleedTop={64} title={title} titleSize={108} />

      <Title text={title} size={108} t={t} marginTop={40} kicker={kicker} />

      {children}

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
        {t.style.sponsorFooter && <SponsorStrip t={t} />}
        <div
          style={{
            display: 'flex',
            paddingTop: 22,
            borderTop: `${t.lightW}px solid ${t.rule}`,
            justifyContent: 'space-between',
            fontSize: 20,
            letterSpacing: 1.5,
            color: t.ink2,
          }}
        >
          <div>{siteHost()}</div>
          {t.style.showVenue && <div style={{ textTransform: 'uppercase' }}>{footerRight}</div>}
        </div>
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
  // The sponsor strip takes about 70px more than the footer alone had spare.
  const rowHeight = Math.min(98, Math.floor((t.compact ? 656 : 790) / Math.max(spec.rows.length, 1)))
  return (
    <Frame t={t} season={spec.season} kicker={afterWeekLabel(spec.afterWeek)} title="League Table">
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 44 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            paddingBottom: 14,
            borderBottom: `${t.heavyW}px solid ${t.heavy}`,
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
          {/* With bar rows the points sit in a box; the header is centred over it. */}
          <div style={{ width: 84, display: 'flex', justifyContent: t.bars ? 'center' : 'flex-end', paddingRight: t.bars ? 4 : 0 }}>Pts</div>
        </div>

        {spec.rows.map((row, ri) => {
          const lead = t.bars && t.style.highlightLeader && ri === 0
          return (
          <div
            key={row.club.slug}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 28,
              ...(t.bars
                ? { ...barSurface(t, lead), height: rowHeight - 10, marginTop: 10, padding: '0 10px 0 14px' }
                : { height: rowHeight, borderBottom: `${t.lightW}px solid ${t.rule}` }),
            }}
          >
            <div style={{ width: t.bars ? 42 : 56, display: 'flex', color: t.bars ? (lead ? t.highlightInk : t.barInk2) : t.ink2 }}>
              {row.position}
            </div>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 18 }}>
              <Crest slug={row.club.slug} box={t.crest(58)} plate={t.plate} />
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
              {t.bars ? (
                <FigureBox t={t} value={row.points} width={68} height={rowHeight - 30} fontSize={36} inverse={lead} />
              ) : (
                row.points
              )}
            </div>
          </div>
          )
        })}
      </div>
      <div style={{ marginTop: 26, fontSize: 18, lineHeight: 1.5, letterSpacing: 1, textTransform: 'uppercase', color: t.ink2 }}>
        GP played · W won · D drawn · L lost · GF goals for · GA goals against · GD goal difference · Pts 3 for a win, 1 for
        a draw
      </div>
    </Frame>
  )
}

function StatLeaders({ spec, t }: { spec: StatLeadersGraphic; t: Theme }) {
  // With the sponsor strip below, each category gives up a little height.
  const tight = t.style.sponsorFooter
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
                padding: tight ? '16px 0' : '26px 0',
                height: tight ? 262 : 322,
                borderBottom: ci < spec.categories.length - 1 ? `${t.lightW}px solid ${t.rule}` : 'none',
              }}
            >
              <div style={{ width: 330, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontStyle: t.style.title.italic ? 'italic' : 'normal',
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
                    <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: tight ? 100 : 124, lineHeight: 0.82 }}>{leader.total}</div>
                    <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, lineHeight: 1, textTransform: 'uppercase' }}>
                      {leader.player}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Crest slug={leader.club.slug} box={t.crest(34)} />
                      <div style={{ display: 'flex', fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase', color: t.ink2 }}>
                        {leader.club.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', fontSize: 22, color: t.ink2 }}>None recorded yet</div>
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
                      ...(t.bars
                        ? { ...barSurface(t), height: tight ? 50 : 54, marginTop: 8, padding: '0 8px 0 14px' }
                        : { height: tight ? 56 : 62, borderBottom: ri < rest.length - 1 ? `${t.lightW}px solid ${t.rule}` : 'none' }),
                    }}
                  >
                    <div style={{ width: 48, display: 'flex', fontSize: 24, color: t.bars ? t.barInk2 : t.ink2 }}>{row.rank}</div>
                    <Crest slug={row.club.slug} box={t.crest(40)} plate={t.plate} />
                    <div style={{ flexGrow: 1, display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 29, textTransform: 'uppercase' }}>
                      {row.player}
                    </div>
                    <div style={{ width: 64, display: 'flex', justifyContent: 'flex-end', fontWeight: 700, fontSize: 30 }}>
                      {t.bars ? <FigureBox t={t} value={row.total} width={58} height={38} fontSize={28} /> : row.total}
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
  // Bars carry a gap between them, and a banner title stands taller, so bar
  // rows are a little shorter to fit the same four games.
  const rowHeight = gameCount <= 4 ? (t.bars ? (t.compact ? (t.style.header === 'tab' ? 144 : 150) : 168) : 188) : Math.max(120, Math.floor(820 / gameCount))
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
          <div style={{ fontSize: 19, letterSpacing: 1.5, textTransform: 'uppercase', color: t.bars ? t.barInk2 : t.ink2 }}>
            {club.standing}
          </div>
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
        {align === 'right' ? name : <Crest slug={club.slug} box={t.crest(crest)} plate={t.plate} />}
        {align === 'right' ? <Crest slug={club.slug} box={t.crest(crest)} plate={t.plate} /> : name}
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
                borderBottom: `${t.heavyW}px solid ${t.heavy}`,
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
                  position: 'relative',
                  alignItems: 'center',
                  ...(t.bars
                    ? { ...barSurface(t), height: rowHeight - 14, marginTop: 14, padding: '0 20px' }
                    : {
                        height: rowHeight,
                        borderBottom: gi < day.games.length - 1 ? `${t.lightW}px solid ${t.rule}` : 'none',
                      }),
                }}
              >
                {/* The slot is a small tag in the row's top-left corner, so it does not push the "v" off the middle. */}
                <div
                  style={{
                    position: 'absolute',
                    top: 10,
                    left: 22,
                    display: 'flex',
                    fontSize: 17,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: t.bars ? t.barInk2 : t.accent,
                  }}
                >
                  {game.slot}
                </div>
                {team(game.home, 'right')}
                {t.bars ? (
                  <div style={{ width: 80, display: 'flex', justifyContent: 'center' }}>
                    <VChip t={t} width={56} height={46} fontSize={30} />
                  </div>
                ) : (
                  <div style={{ width: 56, display: 'flex', justifyContent: 'center', fontSize: 24, color: t.ink2 }}>v</div>
                )}
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
  const line = { position: 'absolute', border: `${t.lightW + 1}px solid ${t.rule}` } as const
  const potw = spec.playerOfTheWeek
  // With the sponsor strip below, the pitch is drawn 10% shorter and its
  // markers a little smaller, so the six still stand clear of each other.
  const k = t.compact ? 0.87 : 1
  const y = (n: number) => Math.round(n * k)
  return (
    <Frame t={t} season={spec.season} kicker={`Matchweek ${pad(spec.week)}`} title="Team of the Week">
      <div style={{ position: 'relative', display: 'flex', height: y(740), marginTop: 36, border: `${t.lightW + 1}px solid ${t.rule}` }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: y(367), height: 0, borderTop: `${t.lightW + 1}px solid ${t.rule}` }} />
        <div style={{ ...line, left: 375, top: y(277), width: 180, height: y(180), borderRadius: 90 }} />
        <div style={{ ...line, left: 235, top: -3, width: 460, height: y(150), borderTop: 'none' }} />
        <div style={{ ...line, left: 355, top: -3, width: 220, height: y(56), borderTop: 'none' }} />
        <div style={{ ...line, left: 235, bottom: -3, width: 460, height: y(150), borderBottom: 'none' }} />
        <div style={{ ...line, left: 355, bottom: -3, width: 220, height: y(56), borderBottom: 'none' }} />

        {spec.picks.map((pick, i) => (
          <div
            key={`${pick.player}-${i}`}
            style={{
              position: 'absolute',
              left: SPOTS[i].x - 160,
              top: y(SPOTS[i].y),
              width: 320,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Crest slug={pick.club.slug} box={t.crest(k < 1 ? 60 : 84)} />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                ...(t.bars ? { ...barSurface(t), padding: '10px 16px 8px' } : { padding: '4px 12px', background: t.bg }),
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
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: 20,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: t.bars ? t.barInk2 : t.ink2,
                }}
              >
                <div>{pick.club.name}</div>
                {pick.statLine && (
                  <div style={{ display: 'flex', color: t.bars ? t.barInk : t.accent, fontWeight: t.bars ? 700 : 400 }}>
                    {pick.statLine}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32, marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Crest slug={potw.club.slug} box={t.crest(104)} />
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

/**
 * The 1080x1920 matchday story. Instagram lays its own controls over roughly
 * the top and bottom 250px of a story, so everything that matters sits inside
 * that band: the padding is the safe zone, not decoration.
 */
function Matchday({ spec, t }: { spec: MatchdayGraphic; t: Theme }) {
  const { width, height } = GRAPHIC_SIZES.matchday
  // Without the bottom block the fixture has the room to itself, so it is
  // drawn larger -- capped so a crest never outgrows its 400px column.
  const footer = t.style.storyFooter
  const crestBox = Math.min(t.crest(footer ? 300 : 360), 400)
  // Name bars sit side by side, so when one name needs two lines both bars
  // take that height and stay level. 13 characters is what fits one line at
  // 54px in a 400px column.
  const nameSize = 54
  const twoLines = t.bars && Math.max(spec.home.name.length, spec.away.name.length) > 13
  const side = (club: MatchdayGraphic['home']) => (
    <div style={{ width: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: footer ? 22 : 28 }}>
      <Crest slug={club.slug} box={crestBox} />
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: nameSize,
          lineHeight: 1,
          textTransform: 'uppercase',
          textAlign: 'center',
          justifyContent: 'center',
          maxWidth: 400,
          ...(t.bars
            ? {
                ...barSurface(t),
                alignSelf: 'stretch',
                alignItems: 'center',
                padding: '16px 18px 10px',
                ...(twoLines ? { height: nameSize * 2 + 26 } : {}),
              }
            : {}),
        }}
      >
        {club.name}
      </div>
      {club.standing && (
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>
          {club.standing}
        </div>
      )}
    </div>
  )
  const isIcnef = spec.venue.includes('ICNEF')

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '250px 72px 250px',
        ...groundStyle(t),
        color: t.ink,
        fontFamily: UTIL,
      }}
    >
      <AccentBar t={t} />
      <Masthead t={t} season={spec.season} kicker={spec.week > 0 ? `Matchweek ${pad(spec.week)}` : 'Playoffs'} bleedTop={0} title="Matchday" titleSize={200} />

      <Title text="Matchday" size={200} t={t} marginTop={48} lineHeight={0.9} kicker={spec.week > 0 ? `Matchweek ${pad(spec.week)}` : 'Playoffs'} />
      <div style={{ display: 'flex', marginTop: 24, alignSelf: t.style.title.align === 'center' ? 'center' : 'flex-start', fontSize: 30, letterSpacing: 3, textTransform: 'uppercase', color: t.accent }}>
        {/* Without the bottom block, the slot (the game's time) joins the date line. */}
        {footer ? `${spec.weekday} · ${spec.date}` : `${spec.weekday} · ${spec.date} · ${spec.slot}`}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginTop: 'auto',
          // With no footer and no sponsor bar below, auto margins on both sides centre the fixture.
          marginBottom: footer || t.style.storySponsors ? 0 : 'auto',
        }}
      >
        {side(spec.home)}
        <div style={{ display: 'flex', height: crestBox, alignItems: 'center', fontSize: 40, color: t.ink2 }}>
          {t.bars ? <VChip t={t} width={84} height={70} fontSize={44} /> : 'v'}
        </div>
        {side(spec.away)}
      </div>

      {/* One bar under the fixture holds both clubs' sponsors, each centred under its club. */}
      {t.style.storySponsors && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 190,
            marginTop: 32,
            marginBottom: footer ? 0 : 'auto',
            ...barSurface(t),
          }}
        >
          {[spec.home, spec.away].map((club) => {
            const sponsor = sponsorOf(club.slug)
            return (
              <div key={club.slug} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 400, gap: 10 }}>
                {sponsor && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <SponsorLogo sponsor={sponsor} width={340} height={100} />
                    <div
                      style={{
                        display: 'flex',
                        fontFamily: DISPLAY,
                        fontWeight: 700,
                        fontSize: 26,
                        lineHeight: 1,
                        letterSpacing: 1,
                        textTransform: 'uppercase',
                        textAlign: 'center',
                      }}
                    >
                      {sponsor.name}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {footer && (
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
      <div style={{ display: 'flex', paddingTop: 28, borderTop: `${t.heavyW}px solid ${t.heavy}`, gap: 48 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 380 }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>Slot</div>
          <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 72, lineHeight: 1, textTransform: 'uppercase', color: t.accent }}>
            {spec.slot}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>Venue</div>
          <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 72, lineHeight: 1, textTransform: 'uppercase' }}>
            {isIcnef ? 'ICNEF' : spec.venue}
          </div>
          {isIcnef && t.style.showVenue && (
            <div style={{ display: 'flex', fontSize: 20, letterSpacing: 1.5, textTransform: 'uppercase', color: t.ink2 }}>
              2333 St Johns Bluff Rd S
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', marginTop: 40, fontSize: 20, letterSpacing: 1.5, color: t.ink2 }}>{siteHost()}</div>
      </div>
      )}
    </div>
  )
}

/** Up or down, drawn as a triangle so it never depends on a font having the glyph. */
function Arrow({ up, color }: { up: boolean; color: string }) {
  return (
    <svg width="16" height="13" viewBox="0 0 12 10">
      <polygon points={up ? '0,10 6,0 12,10' : '0,0 12,0 6,10'} fill={color} />
    </svg>
  )
}

function PowerRankings({ spec, t }: { spec: PowerRankingsGraphic; t: Theme }) {
  const rowHeight = Math.min(116, Math.floor((t.compact ? 800 : t.style.sponsorFooter ? 900 : 930) / Math.max(spec.rows.length, 1)))
  return (
    <Frame t={t} season={spec.season} kicker={`Matchweek ${pad(spec.week)}`} title="Power Rankings">
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: t.bars ? 22 : 30 }}>
        {spec.rows.map((row, ri) => {
          const lead = t.bars && t.style.highlightLeader && ri === 0
          const ink = t.bars ? (lead ? t.highlightInk : t.barInk) : t.ink
          const quiet = t.bars ? (lead ? t.highlightInk : t.barInk2) : t.ink2
          const moved = row.movement
          return (
            <div
              key={row.club.slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                ...(t.bars
                  ? { ...barSurface(t, lead), height: rowHeight - 10, marginTop: 10, padding: '0 20px 0 12px' }
                  : { color: ink, height: rowHeight, borderBottom: `${t.lightW}px solid ${t.rule}` }),
              }}
            >
              <div style={{ width: 64, display: 'flex', justifyContent: 'center' }}>
                {t.bars ? (
                  <FigureBox t={t} value={row.rank} width={58} height={58} fontSize={36} inverse={lead} />
                ) : (
                  <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, lineHeight: 1 }}>
                    {row.rank}
                  </div>
                )}
              </div>
              <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {moved === null || moved === 0 ? (
                  <div style={{ display: 'flex', fontSize: 22, color: quiet }}>-</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Arrow up={moved > 0} color={moved > 0 ? ink : quiet} />
                    <div style={{ display: 'flex', fontSize: 16, color: quiet }}>{Math.abs(moved)}</div>
                  </div>
                )}
              </div>
              <Crest slug={row.club.slug} box={t.crest(64)} plate={t.plate} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, lineHeight: 1, textTransform: 'uppercase' }}>
                  {row.club.name}
                </div>
                <div style={{ display: 'flex', fontSize: 18, lineHeight: 1.25, color: quiet }}>{row.blurb}</div>
              </div>
              <div style={{ width: 110, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ display: 'flex', fontSize: 24, fontWeight: 700 }}>{row.record}</div>
                <div style={{ display: 'flex', fontSize: 16, letterSpacing: 1.5, textTransform: 'uppercase', color: quiet }}>
                  {`${row.points} ${row.points === 1 ? 'pt' : 'pts'}`}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Frame>
  )
}

function Graphic({ spec, t }: { spec: GraphicSpec; t: Theme }) {
  switch (spec.type) {
    case 'power_rankings':
      return <PowerRankings spec={spec} t={t} />
    case 'matchday':
      return <Matchday spec={spec} t={t} />
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

/**
 * The PNG for a spec, in a style (PURO when the id is unknown) on one of its
 * two backgrounds. `headers` are added to the response (caching, download name).
 */
export function renderGraphic(
  spec: GraphicSpec,
  ground: Ground,
  styleId: string | null | undefined,
  headers?: Record<string, string>
): ImageResponse {
  const t = makeTheme(resolveStyle(styleId), ground)
  return new ImageResponse(<Graphic spec={spec} t={t} />, {
    ...GRAPHIC_SIZES[spec.type],
    fonts: loadFonts(),
    headers,
  })
}
