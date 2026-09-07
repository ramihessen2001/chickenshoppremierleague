/**
 * The order a squad reads in: goalkeepers, then out from the back.
 *
 * A team sheet is never alphabetical or by shirt number -- it runs back to
 * front, so the line-up is legible at a glance. This is the one place that
 * order is written down, so the roster, the profile card and anything else
 * that groups players cannot drift apart.
 */

/** Stored values, in team-sheet order. Matches the signup form's list. */
export const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'] as const

export type Position = (typeof POSITIONS)[number]

/**
 * Where players sit who are not on one line.
 *
 * Two kinds land here: those who registered as 'Any', and those with no
 * position recorded at all -- several captains were placed on their club
 * before the form asked. From a reader's point of view they are the same
 * thing: a player not tied to a line.
 */
export const FLEXIBLE = 'Flexible'

const PLURALS: Record<Position, string> = {
  Goalkeeper: 'Goalkeepers',
  Defender: 'Defenders',
  Midfielder: 'Midfielders',
  Forward: 'Forwards',
}

/** Section a stored position belongs to. Unknown values are not discarded. */
export function positionGroup(position?: string | null): string {
  const found = POSITIONS.find(
    (p) => p.toLowerCase() === position?.trim().toLowerCase()
  )
  return found ?? FLEXIBLE
}

/** The heading that section is shown under. */
export function positionHeading(group: string): string {
  return group in PLURALS ? PLURALS[group as Position] : group
}

/**
 * Splits players into their sections, in team-sheet order.
 *
 * Empty sections are dropped rather than shown empty: a club with no
 * recognised goalkeeper has a squad problem, not a rendering one, and an empty
 * heading only makes the roster harder to read.
 */
export function groupByPosition<T>(
  players: T[],
  positionOf: (player: T) => string | null | undefined,
  within: (a: T, b: T) => number
): { group: string; heading: string; players: T[] }[] {
  const buckets = new Map<string, T[]>()
  for (const player of players) {
    const group = positionGroup(positionOf(player))
    const bucket = buckets.get(group)
    if (bucket) bucket.push(player)
    else buckets.set(group, [player])
  }

  // Flexible trails the four lines; anything unrecognised follows it, so a
  // position typed in by hand still appears somewhere rather than vanishing.
  const known = [...POSITIONS, FLEXIBLE] as string[]
  const order = [
    ...known,
    ...[...buckets.keys()].filter((g) => !known.includes(g)).sort(),
  ]

  return order
    .filter((group) => buckets.has(group))
    .map((group) => ({
      group,
      heading: positionHeading(group),
      players: [...buckets.get(group)!].sort(within),
    }))
}
