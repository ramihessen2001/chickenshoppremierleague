/**
 * The content desk's graphics, as data.
 *
 * A draft's graphic is stored as one of these specs: a snapshot of exactly
 * what the picture shows, taken when the draft was written. The PNG is drawn
 * from the snapshot on request (lib/graphics/render.tsx), so an approved
 * graphic stays the same even if a result is corrected afterwards -- the
 * media team approved this picture, not whatever the table says today.
 *
 * Mirrors the four 1080x1440 Instagram templates designed on the canvas, plus
 * a 1080x1920 matchday story per game and a 1280x720 YouTube thumbnail per
 * matchday. Pure types, shared by the desk UI and
 * the server.
 */

export type GraphicType =
  | 'totw'
  | 'table'
  | 'stat_leaders'
  | 'slate'
  | 'matchday'
  | 'power_rankings'
  | 'award_race'
  | 'thumbnail'
  | 'results'
  | 'week_cover'
  | 'story'
export type Ground = 'black' | 'bone'

export const GRAPHIC_TYPES: GraphicType[] = [
  'totw',
  'table',
  'stat_leaders',
  'slate',
  'matchday',
  'power_rankings',
  'award_race',
  'thumbnail',
  'results',
  'week_cover',
  'story',
]

/** Pixel size of each graphic: the four feed posts are 3:4, the matchday story 9:16. */
export const GRAPHIC_SIZES: Record<GraphicType, { width: number; height: number }> = {
  totw: { width: 1080, height: 1440 },
  table: { width: 1080, height: 1440 },
  stat_leaders: { width: 1080, height: 1440 },
  slate: { width: 1080, height: 1440 },
  matchday: { width: 1080, height: 1920 },
  power_rankings: { width: 1080, height: 1440 },
  award_race: { width: 1080, height: 1440 },
  // YouTube's thumbnail size (16:9), for the matchday livestreams.
  thumbnail: { width: 1280, height: 720 },
  results: { width: 1080, height: 1440 },
  week_cover: { width: 1080, height: 1440 },
  story: { width: 1080, height: 1440 },
}
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

/** A 1080x1920 Instagram story for one game on its day. */
export interface MatchdayGraphic {
  type: 'matchday'
  season: string
  week: number
  /** "Saturday" */
  weekday: string
  /** "10 October" */
  date: string
  /** The prayer-time slot, e.g. "Maghrib". */
  slot: string
  venue: string
  home: GraphicClub & { standing: string | null }
  away: GraphicClub & { standing: string | null }
}

/**
 * The league's power rankings: every club in the order the content agent
 * judged them, each with a one-line verdict. The order and verdicts are the
 * agent's opinion; the records, points and movement are computed.
 */
export interface PowerRankingsGraphic {
  type: 'power_rankings'
  season: string
  week: number
  rows: {
    rank: number
    club: GraphicClub
    /** "3-0-0": won, drawn, lost, from the table. */
    record: string
    points: number
    /** One line from the agent, at most POWER_RANKING_BLURB_MAX characters. */
    blurb: string
    /** Places moved since the last approved power rankings: +2 up, -1 down, 0 same, null with none to compare. */
    movement: number | null
  }[]
}

/** A verdict has to fit two lines beside the crest. */
export const POWER_RANKING_BLURB_MAX = 90

/** The four awards the league runs a race for. */
export type AwardKind = 'mvp' | 'young_player' | 'best_keeper' | 'best_defender'
export const AWARD_KINDS: AwardKind[] = ['mvp', 'young_player', 'best_keeper', 'best_defender']

export const AWARD_LABELS: Record<AwardKind, string> = {
  mvp: 'MVP',
  young_player: 'Young Player of the Year',
  best_keeper: 'Best Keeper',
  best_defender: 'Best Defender',
}

/** What the graphic's title bar says: the full award names do not fit one line. */
export const AWARD_RACE_TITLES: Record<AwardKind, string> = {
  mvp: 'MVP Race',
  young_player: 'Young Player Race',
  best_keeper: 'Best Keeper Race',
  best_defender: 'Best Defender Race',
}

/**
 * Young Player of the Year is open to players of this age and under, as
 * registered. Change it here if the league moves the cutoff.
 */
export const YOUNG_PLAYER_MAX_AGE = 18

/** Candidates a race shows: the top few, as many as the league has to show. */
export const AWARD_RACE_MIN = 3
export const AWARD_RACE_MAX = 5

/**
 * The race for one award: the top candidates in the order the content agent
 * judged them, each with figures computed from the box scores. The order is
 * the agent's opinion; every number is fact.
 */
export interface AwardRaceGraphic {
  type: 'award_race'
  season: string
  award: AwardKind
  afterWeek: number | null
  /** What the figures mean, where the labels are short, e.g. "CS clean sheets (club)". */
  legend: string | null
  rows: {
    rank: number
    player: string
    club: GraphicClub
    /** Three figures, the same three labels on every row. */
    stats: { label: string; value: number }[]
  }[]
}

/**
 * A matchweek's results: every game that was played, with its score and man
 * of the match. All fact; the agent has no part in it.
 */
export interface ResultsGraphic {
  type: 'results'
  season: string
  week: number
  days: {
    weekday: string
    date: string
    games: {
      slot: string
      home: GraphicClub
      away: GraphicClub
      homeScore: number
      awayScore: number
      /** Man of the match, when one was named. */
      motm: string | null
    }[]
  }[]
}

/** Limits that keep a story slide's text on the page. */
export const STORY_LIMITS = { label: 20, headline: 56, body: 150, mediaHint: 60, stats: 3, statLabel: 10, statValue: 8 }
export const STORY_COUNT_MIN = 2
export const STORY_COUNT_MAX = 6

/**
 * One storyline of the weekend, as a template slide. The text is the agent's
 * (it chose the story and wrote the headline); the clubs, scoreline and
 * figures come from the database. The media panel is left empty on purpose:
 * the media team lays their own photo or video over it.
 */
export interface StoryGraphic {
  type: 'story'
  season: string
  week: number
  /** This story's place in the series, from 1. */
  index: number
  count: number
  /** The kind of story, shown as the slide's title: "Hat-trick hero". */
  label: string
  headline: string
  body: string
  /** What to put in the media panel: "Video: the 11-2 goals". Null for a plain panel. */
  mediaHint: string | null
  club: GraphicClub | null
  /** A game's scoreline, worked out from the database. */
  game: { home: GraphicClub; away: GraphicClub; homeScore: number; awayScore: number } | null
  stats: { label: string; value: string }[]
}

/**
 * The first slide of "This Week in CSPL": the slides that follow it, in order.
 */
export interface WeekCoverGraphic {
  type: 'week_cover'
  season: string
  week: number
  items: {
    /** The slide's position in the carousel; the cover is 1. */
    slide: number
    label: string
    headline: string | null
  }[]
}

export type GraphicSpec =
  | StoryGraphic
  | WeekCoverGraphic
  | ResultsGraphic
  | AwardRaceGraphic
  | PowerRankingsGraphic
  | TableGraphic
  | StatLeadersGraphic
  | SlateGraphic
  | TotwGraphic
  | MatchdayGraphic
  | ThumbnailGraphic

/**
 * A 1280x720 YouTube thumbnail for one matchday's livestream: every game
 * played that day, in the order they are played.
 */
export interface ThumbnailGraphic {
  type: 'thumbnail'
  season: string
  week: number
  /** "Friday" */
  weekday: string
  /** "16 October" */
  date: string
  games: {
    /** The prayer-time slot, e.g. "Maghrib". */
    slot: string
    home: GraphicClub
    away: GraphicClub
  }[]
}

export const GRAPHIC_LABELS: Record<GraphicType, string> = {
  totw: 'Team of the Week',
  table: 'League Table',
  stat_leaders: 'Stat Leaders',
  slate: 'Matchweek Slate',
  matchday: 'Matchday Story',
  power_rankings: 'Power Rankings',
  award_race: 'Award Race',
  thumbnail: 'Matchday Thumbnail',
  results: 'Weekend Results',
  week_cover: 'This Week in CSPL',
  story: 'Story',
}
