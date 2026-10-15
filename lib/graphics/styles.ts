/**
 * The graphics' design language: every visual choice a graphic makes that is
 * allowed to vary, gathered in one place.
 *
 * PURO is the base style -- the league's own look, as on the website. Every
 * other style is built FROM it: a style lists only what it changes, and
 * `resolveStyle` fills in the rest from PURO. That is what keeps a new style
 * recognisably the league's.
 *
 * What a style may NOT change is decided by what is absent from this file:
 * the fonts (Plex Condensed and Courier Prime), the club crests (never
 * recoloured, only scaled within limits), the league crest and name in the
 * masthead, and the footer URL are fixed in lib/graphics/render.tsx.
 *
 * Styles are designed with the league -- from reference images, in a Claude
 * Code session -- and added here. The media team then chooses one per draft
 * on the content desk. Pure data, shared by the desk UI and the server.
 */

import { Ground, GROUNDS } from './spec'

export interface StylePalette {
  /** What the desk's background switch calls this variant, e.g. "Black". */
  label: string
  bg: string
  /** With a different colour here, the background is a top-to-bottom gradient from bg. */
  bgTo?: string
  /** Primary type: names, figures, titles. */
  ink: string
  /** Secondary type: labels, ranks, dates. */
  ink2: string
  /** Light rules between rows. */
  rule: string
  /** Heavy rules under the masthead and headings. */
  heavy: string
  /** The one accent: kickers, section names, stat lines, slots. */
  accent: string
  /** Type set on an accent fill (title bands). */
  onAccent: string
  /** Colour of the background texture's marks; keep it close to bg. */
  texture: string

  // Used when rows are drawn as bars (rows: 'bars') and by banner titles.
  /** A bar's fill, top to bottom; the same colour twice for a flat bar. */
  barFrom: string
  barTo: string
  /** Type on a bar, and the quieter type on it (ranks, slots, standings). */
  barInk: string
  barInk2: string
  /** The "v" chip's fill, top to bottom, and its type. */
  chipFrom: string
  chipTo: string
  chipInk: string
  /** The box that holds a row's key figure (points, a total). */
  figureBg: string
  figureInk: string
  /** The leader's bar, when the style highlights it. */
  highlightBg: string
  highlightInk: string
  /** The plate a crest sits on inside a bar; the figure box's colour when unset. */
  plateBg?: string
}

/** spotlight: a soft sheen falling from the top edge, like a studio backdrop. */
export type Texture = 'none' | 'diagonal' | 'pinstripe' | 'grid' | 'dots' | 'spotlight'

export interface GraphicStyle {
  id: string
  name: string
  /** One line for the desk and the agent: when to use it. */
  description: string
  /** The backgrounds this style offers, in the order the desk shows them. */
  grounds: Ground[]
  /** One palette per background. */
  palettes: Record<Ground, StylePalette>
  /** A faint pattern over the background. */
  texture: Texture
  title: {
    italic: boolean
    /** Multiplies the title's size; 1 is PURO's. Kept to 0.7-1.15 so titles fit. */
    scale: number
    align: 'left' | 'center'
    /**
     * plain: type only. underline: an accent rule beneath. band: set on an
     * accent fill. banner: a full-width bar in the bar colours.
     */
    treatment: 'plain' | 'underline' | 'band' | 'banner'
  }
  /** Rule thicknesses in px. */
  rules: { heavy: number; light: number }
  /**
   * How rows of a table, slate or leaderboard are drawn. rules: type on the
   * ground with a rule between rows (PURO). bars: each row is a filled bar.
   */
  rows: 'rules' | 'bars'
  /** Bars, chips and banners get a top-to-bottom sheen instead of a flat fill. */
  gloss: boolean
  /** Corner radius of bars, chips, boxes and banners in px. Kept to 0-14. */
  radius: number
  /** In bar rows, the first row (the leader) is drawn in the highlight colours. */
  highlightLeader: boolean
  /**
   * In bar rows, each crest sits on a plate (plateBg) so a crest drawn in the
   * bar's own colour stays visible. Off when the bars are light enough that
   * crests read without one.
   */
  crestPlates: boolean
  /** The season ("Fall 2026") under the league name in the masthead. */
  showSeason: boolean
  /** The venue or its address in footers ("ICNEF · Jacksonville"). The website stays either way. */
  showVenue: boolean
  /**
   * The matchday story's bottom block: slot, venue and website. Without it,
   * the fixture is drawn larger and centred in the space left, and the slot
   * moves up into the date line.
   */
  storyFooter: boolean
  /** Height of an accent strip across the top edge in px; 0 for none. */
  accentBar: number
  /** Multiplies crest sizes; 1 is PURO's. Kept to 0.85-1.2 so layouts hold. */
  crestScale: number
}

/** A style as written in STYLES: anything left out comes from PURO. */
export type StyleOverrides = Pick<GraphicStyle, 'id' | 'name' | 'description'> &
  Partial<{
    grounds: Ground[]
    palettes: Partial<Record<Ground, Partial<StylePalette>>>
    texture: Texture
    title: Partial<GraphicStyle['title']>
    rules: Partial<GraphicStyle['rules']>
    rows: GraphicStyle['rows']
    gloss: boolean
    radius: number
    highlightLeader: boolean
    crestPlates: boolean
    showSeason: boolean
    showVenue: boolean
    storyFooter: boolean
    accentBar: number
    crestScale: number
  }>

/** The league's own look, from app/globals.css. */
export const PURO: GraphicStyle = {
  id: 'puro',
  name: 'PURO',
  description: "The league's house style, as on the website. The default for everything.",
  // Bone only: the league chose to drop black. The black palette below is
  // kept so a style built on it, or bringing black back, is a one-line change.
  grounds: ['bone'],
  palettes: {
    black: {
      label: 'Black',
      bg: '#0d0d0d',
      ink: '#efede8',
      ink2: '#9a958c',
      rule: '#2a2a2a',
      heavy: '#efede8',
      // --wash: the one accent that holds on black.
      accent: '#a5c6cf',
      onAccent: '#0d0d0d',
      texture: '#1a1a1a',
      // PURO draws rows as rules, so these only matter to a style that
      // switches to bars without choosing its own colours.
      barFrom: '#232323',
      barTo: '#181818',
      barInk: '#efede8',
      barInk2: '#9a958c',
      chipFrom: '#a5c6cf',
      chipTo: '#a5c6cf',
      chipInk: '#0d0d0d',
      figureBg: '#efede8',
      figureInk: '#0d0d0d',
      highlightBg: '#efede8',
      highlightInk: '#0d0d0d',
    },
    bone: {
      label: 'Bone',
      bg: '#efede8',
      ink: '#0d0d0d',
      ink2: '#55524c',
      rule: '#cfcac1',
      heavy: '#0d0d0d',
      // --court: wash is never type on a light ground.
      accent: '#3d6b85',
      onAccent: '#efede8',
      texture: '#e4e1da',
      barFrom: '#1c1c1c',
      barTo: '#0d0d0d',
      barInk: '#efede8',
      barInk2: '#9a958c',
      chipFrom: '#3d6b85',
      chipTo: '#3d6b85',
      chipInk: '#efede8',
      figureBg: '#efede8',
      figureInk: '#0d0d0d',
      highlightBg: '#ffffff',
      highlightInk: '#0d0d0d',
    },
  },
  texture: 'none',
  title: { italic: true, scale: 1, align: 'left', treatment: 'plain' },
  rules: { heavy: 5, light: 2 },
  rows: 'rules',
  gloss: false,
  radius: 0,
  highlightLeader: false,
  crestPlates: true,
  showSeason: true,
  showVenue: true,
  storyFooter: true,
  accentBar: 0,
  crestScale: 1,
}

/**
 * Every style the media team can choose, PURO first. Add new styles below
 * PURO as overrides: only what differs.
 */
export const STYLES: StyleOverrides[] = [
  { id: PURO.id, name: PURO.name, description: PURO.description },

  /*
   * From two references: Premier League broadcast graphics of 2007-2013 (an
   * opening-weekend fixture list and a live league table), taken all the way
   * -- an earlier version on bone was dropped because the bone fought the
   * look. The background is the broadcast itself: a deep royal-to-navy
   * gradient with a studio glow from the top. On it, glossy white rows with
   * navy type (the fixture list), red "v" chips, navy points boxes, the
   * leader's row in sky blue, and the title in a glossy white banner (the
   * table's title strip). In the league's own fonts and crests. First built
   * as "Broadcast"; renamed CSPL by the league.
   */
  {
    id: 'cspl',
    name: 'CSPL',
    description:
      'Late-2000s TV football graphics: royal-blue studio background, glossy white rows, red \'v\' chips, navy points boxes, sky-blue leader. For big fixtures, tables and matchday stories.',
    grounds: ['black'],
    palettes: {
      black: {
        label: 'Blue',
        bg: '#2350c9',
        bgTo: '#06144a',
        ink: '#ffffff',
        ink2: '#a9bdec',
        rule: '#3d60c2',
        heavy: '#e9eefc',
        accent: '#7fd0f5',
        onAccent: '#06144a',
        texture: 'rgba(255, 255, 255, 0.22)',
        barFrom: '#ffffff',
        barTo: '#d3dae8',
        barInk: '#0a1d5c',
        barInk2: '#5a6a95',
        chipFrom: '#e8404a',
        chipTo: '#9a0d18',
        chipInk: '#ffffff',
        figureBg: '#0c2268',
        figureInk: '#ffffff',
        highlightBg: '#8dd6f7',
        highlightInk: '#06144a',
      },
    },
    texture: 'spotlight',
    title: { italic: false, treatment: 'banner', align: 'center', scale: 0.82 },
    rules: { heavy: 5, light: 2 },
    rows: 'bars',
    gloss: true,
    radius: 8,
    highlightLeader: true,
    // The rows are white, so crests read straight on them: no plates.
    crestPlates: false,
    // The league asked for these off: no season, no venue or address, and
    // matchday stories without their slot / venue / website block.
    showSeason: false,
    showVenue: false,
    storyFooter: false,
  },
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/** A complete style: the overrides for `id` laid over PURO. Unknown ids get PURO. */
export function resolveStyle(id: string | null | undefined): GraphicStyle {
  const overrides = STYLES.find((s) => s.id === id)
  if (!overrides || overrides.id === PURO.id) return PURO
  const title = { ...PURO.title, ...overrides.title }
  const grounds = (overrides.grounds ?? PURO.grounds).filter((g) => GROUNDS.includes(g))
  return {
    id: overrides.id,
    name: overrides.name,
    description: overrides.description,
    grounds: grounds.length > 0 ? grounds : PURO.grounds,
    palettes: {
      black: { ...PURO.palettes.black, ...overrides.palettes?.black },
      bone: { ...PURO.palettes.bone, ...overrides.palettes?.bone },
    },
    texture: overrides.texture ?? PURO.texture,
    title: { ...title, scale: clamp(title.scale, 0.7, 1.15) },
    rules: { ...PURO.rules, ...overrides.rules },
    rows: overrides.rows ?? PURO.rows,
    gloss: overrides.gloss ?? PURO.gloss,
    radius: clamp(overrides.radius ?? PURO.radius, 0, 14),
    highlightLeader: overrides.highlightLeader ?? PURO.highlightLeader,
    crestPlates: overrides.crestPlates ?? PURO.crestPlates,
    showSeason: overrides.showSeason ?? PURO.showSeason,
    showVenue: overrides.showVenue ?? PURO.showVenue,
    storyFooter: overrides.storyFooter ?? PURO.storyFooter,
    accentBar: clamp(overrides.accentBar ?? PURO.accentBar, 0, 40),
    crestScale: clamp(overrides.crestScale ?? PURO.crestScale, 0.85, 1.2),
  }
}

/**
 * The background a style actually draws on: the one asked for when the style
 * offers it, otherwise the style's first. A draft switched to a bone-only
 * style keeps rendering correctly even if it was saved on black.
 */
export function groundFor(style: GraphicStyle, ground: Ground): Ground {
  return style.grounds.includes(ground) ? ground : style.grounds[0]
}

export const STYLE_IDS = STYLES.map((s) => s.id)
