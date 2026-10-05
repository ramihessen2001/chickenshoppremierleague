/**
 * The content desk's starting points.
 *
 * Each preset is just a brief the media team can edit before sending -- the
 * agent treats it exactly like one typed from scratch. They cover what the
 * league has already been posting: results, the four Instagram templates
 * (Team of the Week, table, stat leaders, matchweek slate), transfers,
 * commissioner's board posts and the newsletter.
 *
 * `kind` is stored on the draft as a label, so past approved drafts of the
 * same kind can be shown to the agent as examples of the house style.
 * Shared by the desk UI and the server; pure and dependency-free.
 */

export interface ContentPreset {
  kind: string
  label: string
  brief: string
}

export const CUSTOM_KIND = 'custom'

export const CONTENT_PRESETS: ContentPreset[] = [
  {
    kind: 'match_report',
    label: 'Match report',
    brief:
      'Write an Instagram caption reporting the most recently completed game: the result, the scorers and assists, the player of the game, and what it means for the table.',
  },
  {
    kind: 'weekly_roundup',
    label: 'Weekly roundup',
    brief:
      "Round up this week's results in one post: every score, the standout performers, and how the table moved.",
  },
  {
    kind: 'totw',
    label: 'Team of the Week',
    brief:
      "Pick a Team of the Week from this week's box scores (1 goalkeeper, 2 defenders, 2 midfielders, 1 forward) plus a Player of the Week. List each pick with their club and stat line, then write the caption.",
  },
  {
    kind: 'table',
    label: 'League table',
    brief:
      'Write the caption for the league table post: who leads, who is climbing, who is in trouble.',
  },
  {
    kind: 'stat_leaders',
    label: 'Stat leaders',
    brief:
      'Write the caption for the stat leaders post: the top scorers, assisters and goalkeepers by saves.',
  },
  {
    kind: 'slate',
    label: 'Matchweek slate',
    brief:
      "Preview this weekend's fixtures: every game with its day and slot, and one line on what is at stake in each.",
  },
  {
    kind: 'trade',
    label: 'Transfer / trade',
    brief: 'Announce this move: [WHO] from [CLUB] to [CLUB]. [ANY OTHER DETAILS]',
  },
  {
    kind: 'board_post',
    label: "Commissioner's board",
    brief: "Write a short commissioner's board post about: [TOPIC]",
  },
  {
    kind: 'newsletter',
    label: 'Newsletter',
    brief:
      "Write this week's league newsletter email: a subject line, then results, the table, stat leaders and next weekend's fixtures.",
  },
]

/** Display label for a stored kind, falling back for 'custom' and retired presets. */
export function presetLabel(kind: string): string {
  return CONTENT_PRESETS.find((p) => p.kind === kind)?.label ?? 'Custom'
}
