/**
 * What the content desk can make: the league's six graphics.
 *
 * The media team picks one, and may add a line of detail (which game, which
 * week). The server turns that into the brief the content agent works from, so
 * the brief is never free text from the browser. `kind` is stored on the draft
 * so past approved graphics of the same kind can be shown to the agent as
 * examples.
 *
 * Shared by the desk UI and the server; pure and dependency-free.
 */

export interface ContentPreset {
  kind: string
  /** The button's label. */
  label: string
  /** What the agent is asked to make, before any detail is added. */
  brief: string
  /** Hint for the optional detail field. */
  detailHint: string
  /** When the graphic comes in kinds the team must pick between (the four awards). */
  choices?: { value: string; label: string }[]
}

export const CONTENT_PRESETS: ContentPreset[] = [
  {
    kind: 'week_in_cspl',
    label: 'This Week in CSPL',
    brief:
      "Make This Week in CSPL for Instagram: a cover listing the stories, the weekend's results, the league table, a template slide for each of the weekend's best storylines, and last the following week's slate.",
    detailHint: 'Which matchweek, e.g. 3? Blank: the latest matchweek with results.',
  },
  {
    kind: 'matchday',
    label: 'Matchday Stories',
    brief: 'Make a matchday story for every game of the matchweek.',
    detailHint: 'Which matchweek, e.g. 3? Blank: the current matchweek.',
  },
  {
    kind: 'thumbnail',
    label: 'Matchday Thumbnails',
    brief: 'Make a YouTube thumbnail for every matchday of the matchweek: one per day, with that day\'s games.',
    detailHint: 'Which matchweek, e.g. 3? Blank: the current matchweek.',
  },
  {
    kind: 'totw',
    label: 'Team of the Week',
    brief:
      "Make the Team of the Week graphic: pick it from the latest week's box scores (1 goalkeeper, 2 defenders, 2 midfielders, 1 forward) plus a Player of the Week.",
    detailHint: 'Which week? Blank: the latest week with results.',
  },
  {
    kind: 'table',
    label: 'League Table',
    brief: 'Make the League Table graphic.',
    detailHint: 'Nothing needed: it shows the table as it stands.',
  },
  {
    kind: 'stat_leaders',
    label: 'Stat Leaders',
    brief: 'Make the Stat Leaders graphic.',
    detailHint: 'Nothing needed: it shows the leaders as they stand.',
  },
  {
    kind: 'slate',
    label: 'Matchweek Slate',
    brief: 'Make the Matchweek Slate graphic.',
    detailHint: 'Which week? Blank: the next week with games to play.',
  },
  {
    kind: 'power_rankings',
    label: 'Power Rankings',
    brief:
      'Make the Power Rankings graphic: rank all eight clubs after the latest matchweek, with a one-line verdict on each.',
    detailHint: 'Anything to weigh? e.g. a club on a streak. Blank: judge on results and form.',
  },
  {
    kind: 'award_race',
    label: 'Award Race',
    brief:
      'Make the Award Race graphic: the top candidates for the award, best first, judged on the season so far.',
    detailHint: 'Anything to weigh? e.g. a player who has missed games. Blank: judge on the figures.',
    choices: [
      { value: 'mvp', label: 'MVP' },
      { value: 'young_player', label: 'Young Player of the Year' },
      { value: 'best_keeper', label: 'Best Keeper' },
      { value: 'best_defender', label: 'Best Defender' },
    ],
  },
]

/** The brief the agent works from: the preset's, plus the team's detail if any. */
export function buildBrief(kind: string, details: string, choice = ''): string | null {
  const preset = CONTENT_PRESETS.find((p) => p.kind === kind)
  if (!preset) return null
  let brief = preset.brief
  if (preset.choices) {
    const picked = preset.choices.find((c) => c.value === choice)
    if (!picked) return null
    brief = `${brief} The award: ${picked.label} (award = ${picked.value}).`
  }
  const extra = details.trim()
  return extra ? `${brief}\n\nFrom the media team: ${extra}` : brief
}

/** Display label for a stored kind; drafts made before the desk was graphics-only fall back. */
export function presetLabel(kind: string): string {
  return CONTENT_PRESETS.find((p) => p.kind === kind)?.label ?? 'Earlier draft'
}
