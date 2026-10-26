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
  AWARD_LABELS,
  AWARD_RACE_TITLES,
  AwardRaceGraphic,
  GRAPHIC_SIZES,
  GraphicSpec,
  Ground,
  MatchdayGraphic,
  PowerRankingsGraphic,
  ResultsGraphic,
  StoryGraphic,
  WeekCoverGraphic,
  SlateGraphic,
  StatLeadersGraphic,
  TableGraphic,
  TotwGraphic,
  ThumbnailGraphic,
  GraphicClub,
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
 * How big to draw a logo so the sponsors look equally large. Logos are very
 * different shapes -- a wide wordmark next to a tall crest -- so a common
 * height or width makes the wide ones loom or the tall ones shrink. Giving
 * each logo the same AREA evens that out: height is sqrt(area / ratio), held
 * to `maxH` and to `maxW` (a wide logo is limited by width first).
 */
function sponsorSize(ratio: number, area: number, maxH: number, maxW: number) {
  const height = Math.min(maxH, Math.sqrt(area / ratio), maxW / ratio)
  return { width: Math.round(height * ratio), height: Math.round(height) }
}

const sponsorRatio = (sponsor: Sponsor) => assetImage('sponsors', sponsor.file)?.ratio ?? 1

/**
 * All eight sponsors in one row above the footer URL, on a single bar in the
 * style's bar colours. The bar is one block behind the whole row: no logo has a
 * background of its own. The logos share one area (the largest that fits the
 * row with a gap between each), and the gaps are equal, so the row is centred
 * between the margins whatever shape the logos are.
 */
function SponsorStrip({
  t,
  width = 936,
  barHeight = 92,
  logoHeight = 62,
  marginBottom = 22,
}: {
  t: Theme
  /** The bar's full width; the defaults are the 1080-wide posts'. */
  width?: number
  barHeight?: number
  /** The tallest a logo may be drawn. */
  logoHeight?: number
  marginBottom?: number
}) {
  const ratios = SPONSORS.map(sponsorRatio)
  const room = width - 2 * 28 - 7 * 26 // the bar's padding and the smallest gaps
  const rowWidth = (area: number) =>
    ratios.reduce((sum, ratio) => sum + sponsorSize(ratio, area, logoHeight, room).width, 0)
  let area = 12000
  while (area > 1000 && rowWidth(area) > room) area -= 100
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: barHeight,
        marginBottom,
        padding: '0 28px',
        ...barSurface(t),
      }}
    >
      {SPONSORS.map((sponsor, i) => {
        const { width, height } = sponsorSize(ratios[i], area, logoHeight, room)
        return <SponsorLogo key={sponsor.slug} sponsor={sponsor} width={width} height={height} />
      })}
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

/**
 * How tall each game's row can be on a graphic that stacks days of games (the
 * slate and the results). The room is fixed, and every day takes a header and a
 * gap, so a Friday-Saturday-Sunday week with six games has far less per row
 * than a two-day week with four. `tier` says how much to shrink the row's
 * contents to suit: 0 is the roomy layout, 2 the tightest.
 */
function dayLayout(t: Theme, days: number, games: number, roomiest: number) {
  const dense = games > 4 || days > 2
  const header = dense ? 46 : 64
  const gap = dense ? 22 : 44
  const top = dense ? 28 : 48
  const available = (t.compact ? 800 : 892) - top - days * header - Math.max(0, days - 1) * gap
  const rowHeight = Math.max(60, Math.min(roomiest, Math.floor(available / Math.max(games, 1))))
  const tier = rowHeight >= 140 ? 0 : rowHeight >= 92 ? 1 : 2
  return { rowHeight, tier, gap, top, headerFont: dense ? 32 : 40, headerPad: dense ? 8 : 14, rowGap: tier === 0 ? 14 : tier === 1 ? 10 : 8 }
}

function Slate({ spec, t }: { spec: SlateGraphic; t: Theme }) {
  const gameCount = spec.days.reduce((n, d) => n + d.games.length, 0)
  // Bars carry a gap between them, and a banner title stands taller, so bar
  // rows are a little shorter to fit the same four games; more games or a
  // third day (Friday to Sunday) shrink them further.
  const L = dayLayout(t, spec.days.length, gameCount, t.bars ? (t.compact ? (t.style.header === 'tab' ? 144 : 150) : 168) : 188)
  const { rowHeight, tier } = L
  const crest = tier === 0 ? (rowHeight >= 160 ? 92 : 72) : tier === 1 ? 60 : 44

  // Both sides face the "v": the home crest sits right of its name, the away
  // crest left of its name.
  const team = (club: SlateGraphic['days'][number]['games'][number]['home'], align: 'left' | 'right') => {
    const name = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: tier === 0 ? 34 : tier === 1 ? 30 : 26,
            lineHeight: 1,
            textTransform: 'uppercase',
            textAlign: align,
            maxWidth: 240,
          }}
        >
          {club.name}
        </div>
        {club.standing && tier < 2 && (
          <div style={{ fontSize: tier === 0 ? 19 : 16, letterSpacing: 1.5, textTransform: 'uppercase', color: t.bars ? t.barInk2 : t.ink2 }}>
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
          gap: tier === 2 ? 14 : 20,
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: L.gap, marginTop: L.top }}>
        {spec.days.map((day) => (
          <div key={day.date} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: L.headerPad,
                borderBottom: `${t.heavyW}px solid ${t.heavy}`,
              }}
            >
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: L.headerFont, lineHeight: 1, textTransform: 'uppercase' }}>
                {day.weekday}
              </div>
              <div style={{ fontSize: tier === 0 ? 22 : 19, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>{day.date}</div>
            </div>
            {day.games.map((game, gi) => (
              <div
                key={gi}
                style={{
                  display: 'flex',
                  position: 'relative',
                  alignItems: 'center',
                  ...(t.bars
                    ? { ...barSurface(t), height: rowHeight - L.rowGap, marginTop: L.rowGap, padding: '0 20px' }
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
                    top: tier === 0 ? 10 : 6,
                    left: 22,
                    display: 'flex',
                    fontSize: tier === 0 ? 17 : 14,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: t.bars ? t.barInk2 : t.accent,
                  }}
                >
                  {game.slot}
                </div>
                {team(game.home, 'right')}
                {t.bars ? (
                  <div style={{ width: tier === 0 ? 80 : 68, display: 'flex', justifyContent: 'center' }}>
                    <VChip t={t} width={tier === 0 ? 56 : 48} height={tier === 0 ? 46 : tier === 1 ? 38 : 32} fontSize={tier === 0 ? 30 : tier === 1 ? 26 : 22} />
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

/**
 * A font size for text that has to stay on one line: the size of the first
 * [maxLength, size] step the text fits, else `smallest`.
 */
function fitName(text: string, steps: [number, number][], smallest: number): number {
  return steps.find(([maxLength]) => text.length <= maxLength)?.[1] ?? smallest
}

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
              left: SPOTS[i].x - 170,
              top: y(SPOTS[i].y),
              width: 340,
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
                  // A long name shrinks to stay on one line: a second line would make the
                  // card taller and run it into the crest of the player below.
                  fontSize: fitName(pick.player, [[13, 34], [16, 30], [19, 26]], 22),
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  textTransform: 'uppercase',
                  textAlign: 'center',
                }}
              >
                {pick.player}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: fitName(`${pick.club.name} ${pick.statLine}`, [[22, 20], [26, 17]], 15),
                  whiteSpace: 'nowrap',
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
            <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: fitName(potw.player, [[13, 56], [16, 50], [20, 44]], 38), whiteSpace: 'nowrap', lineHeight: 0.95, textTransform: 'uppercase' }}>
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
                    {/* A fixed-height slot, so both sponsors' names sit on the same line however tall the logos are. */}
                    <div style={{ display: 'flex', height: 118, alignItems: 'center' }}>
                      <SponsorLogo sponsor={sponsor} {...sponsorSize(sponsorRatio(sponsor), 9500, 118, 340)} />
                    </div>
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

/**
 * The race for one award: the top candidates, each with three figures. Rows
 * are bars like the table's, the leader in the highlight colours.
 */
function AwardRace({ spec, t }: { spec: AwardRaceGraphic; t: Theme }) {
  const labels = spec.rows[0]?.stats.map((s) => s.label) ?? []
  const rowHeight = spec.rows.length > 4 ? 112 : 128
  const STAT_W = 96
  const GAP = 10
  const statsWidth = labels.length * STAT_W + (labels.length - 1) * GAP
  return (
    <Frame t={t} season={spec.season} kicker={afterWeekLabel(spec.afterWeek)} title={AWARD_RACE_TITLES[spec.award]}>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: t.accent }}>
          {`Top ${spec.rows.length} · ${AWARD_LABELS[spec.award]}`}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            marginTop: 22,
            paddingBottom: 14,
            borderBottom: `${t.heavyW}px solid ${t.heavy}`,
            fontSize: 19,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: t.ink2,
          }}
        >
          <div style={{ width: 70, display: 'flex' }}>#</div>
          <div style={{ flexGrow: 1, display: 'flex' }}>Player</div>
          <div style={{ display: 'flex', width: statsWidth, gap: GAP }}>
            {labels.map((label) => (
              <div key={label} style={{ width: STAT_W, display: 'flex', justifyContent: 'center' }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        {spec.rows.map((row, ri) => {
          const lead = t.bars && t.style.highlightLeader && ri === 0
          const quiet = t.bars ? (lead ? t.highlightInk : t.barInk2) : t.ink2
          return (
            <div
              key={`${row.player}-${ri}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                ...(t.bars
                  ? { ...barSurface(t, lead), height: rowHeight - 10, marginTop: 10, padding: '0 14px 0 12px' }
                  : { height: rowHeight, borderBottom: `${t.lightW}px solid ${t.rule}` }),
              }}
            >
              <div style={{ width: 58, display: 'flex', justifyContent: 'center' }}>
                {t.bars ? (
                  <FigureBox t={t} value={row.rank} width={58} height={58} fontSize={36} inverse={lead} />
                ) : (
                  <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 52, lineHeight: 1 }}>
                    {row.rank}
                  </div>
                )}
              </div>
              <Crest slug={row.club.slug} box={t.crest(68)} plate={t.plate} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, lineHeight: 1, textTransform: 'uppercase' }}>
                  {row.player}
                </div>
                <div style={{ display: 'flex', fontSize: 19, letterSpacing: 1.5, textTransform: 'uppercase', color: quiet }}>
                  {row.club.name}
                </div>
              </div>
              <div style={{ display: 'flex', width: statsWidth, gap: GAP }}>
                {row.stats.map((stat) =>
                  t.bars ? (
                    <FigureBox
                      key={stat.label}
                      t={t}
                      value={stat.value}
                      width={STAT_W}
                      height={rowHeight - 38}
                      fontSize={38}
                    />
                  ) : (
                    <div
                      key={stat.label}
                      style={{ width: STAT_W, display: 'flex', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 38 }}
                    >
                      {stat.value}
                    </div>
                  )
                )}
              </div>
            </div>
          )
        })}

        {spec.legend && (
          <div style={{ display: 'flex', marginTop: 24, fontSize: 18, lineHeight: 1.5, letterSpacing: 1, textTransform: 'uppercase', color: t.ink2 }}>
            {spec.legend}
          </div>
        )}
      </div>
    </Frame>
  )
}

/**
 * The 1280x720 YouTube thumbnail for a matchday's livestream: the league and
 * the day across the top, one centred bar per game, and all eight sponsors on
 * a white bar along the bottom. Thumbnails are seen small,
 * in a grid of videos, so everything is drawn large and the bars, crests and
 * names grow or shrink with how many games the day holds.
 */
function Thumbnail({ spec, t }: { spec: ThumbnailGraphic; t: Theme }) {
  const { width, height } = GRAPHIC_SIZES.thumbnail
  const count = Math.max(spec.games.length, 1)
  const gap = 16
  // 720 less the padding, the header, the sponsor bar and the gaps between.
  const sponsorBar = 78
  const room = height - 2 * 40 - 112 - 22 - sponsorBar - 18
  const barHeight = Math.min(200, Math.floor((room - gap * (count - 1)) / count))
  const crest = Math.round(barHeight * 0.62)
  const nameSize = barHeight >= 200 ? 46 : barHeight >= 150 ? 38 : 30
  const kicker = spec.week > 0 ? `Matchweek ${pad(spec.week)}` : 'Playoffs'

  // Each name takes an equal share either side of the "v", so the chip stays
  // on the bar's centre line; the text inside is capped in width, so a long
  // name ("S.C Istanbul Black") wraps to two lines instead of running to the
  // bar's edge and making the matchup look off-centre.
  const nameWidth = 290
  const name = (club: GraphicClub, align: 'left' | 'right') => (
    <div style={{ display: 'flex', flex: 1, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          display: 'flex',
          maxWidth: nameWidth,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: nameSize,
          lineHeight: 1,
          textTransform: 'uppercase',
          textAlign: align,
        }}
      >
        {club.name}
      </div>
    </div>
  )

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '40px 48px',
        ...groundStyle(t),
        color: t.ink,
        fontFamily: UTIL,
      }}
    >
      <AccentBar t={t} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 112 }}>
        <Crest slug="cspl" box={104} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
          <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 34, lineHeight: 1, textTransform: 'uppercase' }}>
            YM Chicken Shop Premier League
          </div>
          <div style={{ display: 'flex', fontSize: 24, letterSpacing: 2.5, textTransform: 'uppercase', color: t.accent }}>
            {kicker}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 6,
            padding: '14px 24px 10px',
            ...barSurface(t),
          }}
        >
          <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, lineHeight: 1, textTransform: 'uppercase' }}>
            {spec.weekday}
          </div>
          <div style={{ display: 'flex', fontSize: 20, letterSpacing: 2, textTransform: 'uppercase', color: t.barInk2 }}>
            {spec.date}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap, flex: 1, marginTop: 22 }}>
        {spec.games.map((game, i) => (
          <div
            key={`${game.home.slug}-${game.away.slug}-${i}`}
            // Both names take an equal share either side, so the "v" sits on the
            // bar's centre line and every matchup is centred.
            style={{ display: 'flex', alignItems: 'center', height: barHeight, padding: '0 32px', gap: 22, ...barSurface(t) }}
          >
            {name(game.home, 'right')}
            <Crest slug={game.home.slug} box={t.crest(crest)} plate={t.plate} />
            <VChip t={t} width={70} height={58} fontSize={34} />
            <Crest slug={game.away.slug} box={t.crest(crest)} plate={t.plate} />
            {name(game.away, 'left')}
          </div>
        ))}
      </div>

      {/* All eight sponsors on one white bar, nothing behind any single logo. */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 18 }}>
        <SponsorStrip t={t} width={width - 2 * 48} barHeight={sponsorBar} logoHeight={52} marginBottom={0} />
      </div>
    </div>
  )
}

/**
 * A matchweek's results: each game's score in the middle of its row, the clubs
 * either side, and the man of the match along the bottom. Rows are laid out
 * like the slate's, so the two read as a pair.
 */
function Results({ spec, t }: { spec: ResultsGraphic; t: Theme }) {
  const gameCount = spec.days.reduce((n, d) => n + d.games.length, 0)
  const L = dayLayout(t, spec.days.length, gameCount, t.bars ? (t.compact ? 150 : 168) : 188)
  const { rowHeight, tier } = L
  const crest = tier === 0 ? 72 : tier === 1 ? 58 : 44
  // With rows this short there is no room for the man of the match under the score.
  const showMotm = tier === 0

  const side = (club: ResultsGraphic['days'][number]['games'][number]['home'], align: 'left' | 'right') => {
    const name = (
      <div
        style={{
          display: 'flex',
          fontFamily: DISPLAY,
          fontWeight: 700,
          fontSize: fitName(club.name, [[10, tier === 0 ? 38 : tier === 1 ? 32 : 28], [14, tier === 0 ? 32 : 28]], tier === 0 ? 28 : 24),
          lineHeight: 1,
          textTransform: 'uppercase',
          textAlign: align,
          maxWidth: 230,
        }}
      >
        {club.name}
      </div>
    )
    const mark = <Crest slug={club.slug} box={t.crest(crest)} plate={t.plate} />
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: tier === 2 ? 12 : 18,
          justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        }}
      >
        {align === 'right' ? name : mark}
        {align === 'right' ? mark : name}
      </div>
    )
  }

  return (
    <Frame t={t} season={spec.season} kicker={`Matchweek ${pad(spec.week)}`} title="Weekend Results">
      <div style={{ display: 'flex', flexDirection: 'column', gap: L.gap, marginTop: L.top }}>
        {spec.days.map((day) => (
          <div key={day.date} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                paddingBottom: L.headerPad,
                borderBottom: `${t.heavyW}px solid ${t.heavy}`,
              }}
            >
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: L.headerFont, lineHeight: 1, textTransform: 'uppercase' }}>
                {day.weekday}
              </div>
              <div style={{ fontSize: tier === 0 ? 22 : 19, letterSpacing: 2, textTransform: 'uppercase', color: t.ink2 }}>{day.date}</div>
            </div>
            {day.games.map((game, gi) => (
              <div
                key={gi}
                style={{
                  display: 'flex',
                  position: 'relative',
                  alignItems: 'center',
                  ...(t.bars
                    ? { ...barSurface(t), height: rowHeight - L.rowGap, marginTop: L.rowGap, padding: '0 20px' }
                    : {
                        height: rowHeight,
                        borderBottom: gi < day.games.length - 1 ? `${t.lightW}px solid ${t.rule}` : 'none',
                      }),
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: tier === 0 ? 10 : 6,
                    left: 22,
                    display: 'flex',
                    fontSize: tier === 0 ? 17 : 14,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: t.bars ? t.barInk2 : t.accent,
                  }}
                >
                  {game.slot}
                </div>
                {side(game.home, 'right')}
                <div style={{ width: tier === 0 ? 190 : 170, display: 'flex', justifyContent: 'center' }}>
                  {t.bars ? (
                    <FigureBox
                      t={t}
                      value={`${game.homeScore} – ${game.awayScore}`}
                      width={tier === 0 ? 160 : 140}
                      height={tier === 0 ? 70 : tier === 1 ? 58 : 46}
                      fontSize={tier === 0 ? 44 : tier === 1 ? 36 : 30}
                    />
                  ) : (
                    <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 52 }}>
                      {`${game.homeScore} – ${game.awayScore}`}
                    </div>
                  )}
                </div>
                {side(game.away, 'left')}
                {showMotm && game.motm && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 9,
                      left: 0,
                      right: 0,
                      display: 'flex',
                      justifyContent: 'center',
                      fontSize: 16,
                      letterSpacing: 2,
                      textTransform: 'uppercase',
                      color: t.bars ? t.barInk2 : t.ink2,
                    }}
                  >
                    {`Man of the match · ${game.motm}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </Frame>
  )
}

/**
 * The first slide of "This Week in CSPL": the slides after it, in order, as
 * numbered bars -- the results, the table, then each story's headline.
 */
function WeekCover({ spec, t }: { spec: WeekCoverGraphic; t: Theme }) {
  const rowHeight = Math.min(104, Math.floor((t.compact ? 640 : 740) / Math.max(spec.items.length, 1)))
  return (
    <Frame t={t} season={spec.season} kicker={`Matchweek ${pad(spec.week)}`} title="This Week in CSPL">
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
        {spec.items.map((item) => (
          <div
            key={item.slide}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              ...(t.bars
                ? { ...barSurface(t), height: rowHeight - 10, marginTop: 10, padding: '0 20px 0 14px' }
                : { height: rowHeight, borderBottom: `${t.lightW}px solid ${t.rule}` }),
            }}
          >
            {t.bars ? (
              <FigureBox t={t} value={item.slide} width={58} height={Math.min(58, rowHeight - 28)} fontSize={34} />
            ) : (
              <div style={{ display: 'flex', width: 58, fontFamily: DISPLAY, fontWeight: 700, fontSize: 40 }}>{item.slide}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
              {item.headline ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', fontSize: 17, letterSpacing: 2, textTransform: 'uppercase', color: t.bars ? t.barInk2 : t.accent }}>
                    {item.label}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontFamily: DISPLAY,
                      fontWeight: 700,
                      fontSize: fitName(item.headline, [[34, 34], [44, 30]], 26),
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {item.headline}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, lineHeight: 1, textTransform: 'uppercase' }}>
                  {item.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  )
}

/**
 * One storyline as a template: a panel kept empty for the media team's photo or
 * video, the headline and a line of text under it, and -- when the story has
 * them -- a scoreline and up to three figures along the bottom.
 */
/** The media team's videos are 1920 x 1080, so the panel they go over is exactly 16:9. */
const VIDEO_RATIO = 16 / 9
const PANEL_MAX_WIDTH = 936
/** Below this width the figures, then the scoreline, are dropped to give a video a useful window. */
const PANEL_MIN_WIDTH = 600

/**
 * The panel's size, and which extras fit under it. The panel is always 16:9, as
 * large as the rest of the slide leaves room for: the headline and text take
 * what they need (estimated from their length), then the scoreline and figures,
 * and the panel takes the height that remains. When a story carries a lot, the
 * figures and then the scoreline are dropped before the panel shrinks below a
 * useful size.
 */
function storyLayout(spec: StoryGraphic) {
  const headFont = fitName(spec.headline, [[26, 60], [38, 52]], 44)
  const headWidth = PANEL_MAX_WIDTH - (spec.club && !spec.game ? 114 : 0)
  // Uppercase Plex Condensed Bold runs about 0.58em a letter, and a line breaks at a space,
  // so allow a little more than that.
  const headLines = Math.max(1, Math.ceil(spec.headline.length / Math.floor(headWidth / (headFont * 0.62))))
  const headHeight = Math.ceil(headLines * headFont * 1.02)
  const bodyFont = fitName(spec.body, [[110, 26], [170, 23]], 21)
  const bodyLines = spec.body ? Math.ceil(spec.body.length / Math.floor(PANEL_MAX_WIDTH / (bodyFont * 0.64))) : 0
  const bodyHeight = bodyLines > 0 ? 16 + Math.ceil(bodyLines * bodyFont * 1.4) : 0

  let showGame = spec.game !== null
  let showStats = spec.stats.length > 0
  const widthFor = (game: boolean, stats: boolean) => {
    // 788 is the height from the panel's top to the sponsor bar's, less a margin for estimates that run short.
    const room = 750 - (24 + headHeight) - bodyHeight - (game ? 116 : 0) - (stats ? 92 : 0)
    return Math.min(PANEL_MAX_WIDTH, Math.floor(room * VIDEO_RATIO))
  }
  if (widthFor(showGame, showStats) < PANEL_MIN_WIDTH) showStats = false
  if (widthFor(showGame, showStats) < PANEL_MIN_WIDTH) showGame = false
  const width = Math.max(480, widthFor(showGame, showStats))
  return { panelWidth: width, panelHeight: Math.round(width / VIDEO_RATIO), showGame, showStats }
}

/**
 * A figure as it should read in its box: the number big, what it measures
 * small. A figure written "4 goals" with "Rashid" as its label becomes "4" over
 * "Rashid goals". This tidies slides made before the agent was held to that.
 */
function tidyFigure(stat: { label: string; value: string }) {
  const split = stat.value.match(/^([+\-−]?\d[\d.,:/–-]*%?)\s+(.+)$/)
  return split ? { value: split[1], label: `${stat.label} ${split[2]}`.trim() } : stat
}

function StorySlide({ spec, t }: { spec: StoryGraphic; t: Theme }) {
  const { panelWidth, panelHeight, showGame, showStats } = storyLayout(spec)
  const hasStats = showStats
  const game = showGame ? spec.game : null
  return (
    <Frame
      t={t}
      season={spec.season}
      kicker={spec.count > 1 ? `Story ${spec.index} of ${spec.count}` : `Matchweek ${pad(spec.week)}`}
      title={spec.label}
    >
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 26 }}>
        {spec.mediaUrl ? (
          // The media team's own picture, filling the panel; cropped to fit, never stretched.
          <div style={{ display: 'flex', alignSelf: 'center', width: panelWidth, height: panelHeight, borderRadius: t.radius + 4, overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- next/og draws plain <img> */}
            <img src={spec.mediaUrl} width={panelWidth} height={panelHeight} style={{ width: panelWidth, height: panelHeight, objectFit: 'cover' }} alt="" />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              alignSelf: 'center',
              width: panelWidth,
              height: panelHeight,
              borderRadius: t.radius + 4,
              background: 'rgba(255, 255, 255, 0.10)',
              border: '2px solid rgba(255, 255, 255, 0.35)',
              color: t.ink2,
            }}
          >
            <div style={{ display: 'flex', fontSize: 19, letterSpacing: 3, textTransform: 'uppercase' }}>Add photo or video</div>
            {spec.mediaHint && (
              <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 30, textTransform: 'uppercase', color: t.ink, maxWidth: panelWidth - 100, textAlign: 'center' }}>
                {spec.mediaHint}
              </div>
            )}
            {/* The window is exactly the shape of the team's videos, and says so. */}
            <div style={{ display: 'flex', fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
              {`16:9 · 1920 × 1080 · ${panelWidth} × ${panelHeight} here`}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 24 }}>
          {spec.club && !game && <Crest slug={spec.club.slug} box={t.crest(92)} />}
          <div
            style={{
              display: 'flex',
              flex: 1,
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: fitName(spec.headline, [[26, 60], [38, 52]], 44),
              lineHeight: 1.02,
              textTransform: 'uppercase',
            }}
          >
            {spec.headline}
          </div>
        </div>

        {spec.body && (
          <div style={{ display: 'flex', marginTop: 16, fontSize: fitName(spec.body, [[110, 26], [170, 23]], 21), lineHeight: 1.4, color: t.ink2 }}>
            {spec.body}
          </div>
        )}

        {game && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 96,
              marginTop: 20,
              padding: '0 20px',
              ...barSurface(t),
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
              <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: fitName(game.home.name, [[12, 32]], 26), textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {game.home.name}
              </div>
              <Crest slug={game.home.slug} box={t.crest(62)} plate={t.plate} />
            </div>
            <div style={{ width: 170, display: 'flex', justifyContent: 'center' }}>
              <FigureBox t={t} value={`${game.homeScore} – ${game.awayScore}`} width={140} height={62} fontSize={38} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 14 }}>
              <Crest slug={game.away.slug} box={t.crest(62)} plate={t.plate} />
              <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: fitName(game.away.name, [[12, 32]], 26), textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {game.away.name}
              </div>
            </div>
          </div>
        )}

        {hasStats && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 16 }}>
            {spec.stats.map(tidyFigure).map((stat) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  maxWidth: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  height: 76,
                  ...barSurface(t),
                }}
              >
                <div style={{ display: 'flex', fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ display: 'flex', fontSize: 15, letterSpacing: 2, textTransform: 'uppercase', color: t.bars ? t.barInk2 : t.ink2 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Frame>
  )
}

function Graphic({ spec, t }: { spec: GraphicSpec; t: Theme }) {
  switch (spec.type) {
    case 'week_cover':
      return <WeekCover spec={spec} t={t} />
    case 'story':
      return <StorySlide spec={spec} t={t} />
    case 'results':
      return <Results spec={spec} t={t} />
    case 'thumbnail':
      return <Thumbnail spec={spec} t={t} />
    case 'award_race':
      return <AwardRace spec={spec} t={t} />
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
