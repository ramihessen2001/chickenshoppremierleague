/**
 * The content desk's graphics, as data.
 *
 * A draft's graphic is stored as one of these specs: a snapshot of exactly
 * what the picture shows, taken when the draft was written. The PNG is drawn
 * from the snapshot on request (lib/graphics/render.tsx), so an approved
 * graphic stays the same even if a result is corrected afterwards -- the
 * media team approved this picture, not whatever the table says today.
 *
 * Mirrors the four 1080x1440 Instagram templates designed on the canvas.
 * Pure types, shared by the desk UI and the server.
 */

export type GraphicType = 'totw' | 'table' | 'stat_leaders' | 'slate'
export type Ground = 'black' | 'bone'

export const GRAPHIC_TYPES: GraphicType[] = ['totw', 'table', 'stat_leaders', 'slate']
export const GROUNDS: Ground[] = ['black', 'bone']

/** A club as a graphic shows it: the slug picks the crest, the name is printed. */
export interface GraphicClub {
  slug: string
  name: string
}

export interface TableGraphic {
  type: 'table'
  season: string
  /** Last week with a completed game, or null before any. */
  afterWeek: number | null
  rows: {
    position: number
    club: GraphicClub
    played: number
    won: number
    drawn: number
    lost: number
    goalsFor: number
    goalsAgainst: number
    goalDifference: number
    points: number
  }[]
}

export interface StatLeadersGraphic {
  type: 'stat_leaders'
  season: string
  afterWeek: number | null
  categories: {
    label: string
    rows: {
      /** "1", "2", "=3" -- ties share a rank and are marked. */
      rank: string
      player: string
      club: GraphicClub
      total: number
    }[]
  }[]
}

export interface SlateGraphic {
  type: 'slate'
  season: string
  week: number
  venue: string
  days: {
    /** "Friday" */
    weekday: string
    /** "23 October" */
    date: string
    games: {
      /** The prayer-time slot, e.g. "Maghrib". */
      slot: string
      home: GraphicClub & { standing: string | null }
      away: GraphicClub & { standing: string | null }
    }[]
  }[]
}

export type TotwLine = 'GK' | 'DEF' | 'MID' | 'FWD'

export interface TotwGraphic {
  type: 'totw'
  season: string
  week: number
  /** In pitch order: FWD, MID, MID, DEF, DEF, GK. */
  picks: {
    line: TotwLine
    player: string
    club: GraphicClub
    /** Computed from the week's box scores, e.g. "3G 1A" or "9 Saves". */
    statLine: string
  }[]
  playerOfTheWeek: {
    player: string
    club: GraphicClub
    position: string | null
    /** The player's non-zero totals for the week, biggest first, at most two. */
    stats: { label: string; value: number }[]
  }
}

export type GraphicSpec = TableGraphic | StatLeadersGraphic | SlateGraphic | TotwGraphic

export const GRAPHIC_LABELS: Record<GraphicType, string> = {
  totw: 'Team of the Week',
  table: 'League Table',
  stat_leaders: 'Stat Leaders',
  slate: 'Matchweek Slate',
}
