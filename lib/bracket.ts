/**
 * Playoff bracket seeding for an 8-team field.
 *
 * All 8 standings positions make the playoffs -- no byes, no play-in round.
 * Pure and dependency-free, like lib/draft.ts and lib/standings.ts, so the
 * pairing rules can be reasoned about (and tested) on their own, separate
 * from the database calls that turn them into games.
 *
 *   Quarterfinals   1st v 8th, 2nd v 7th, 3rd v 6th, 4th v 5th
 *   Semifinals      the 1v8 and 4v5 winners meet; the 2v7 and 3v6 winners
 *                   meet -- so the top two seeds can only face each other
 *                   in the final
 *   Final           the two semifinal winners
 */

export interface BracketTeam {
  /** Database UUID -- what a game actually references. */
  id: string
  slug: string
  name: string
  /** 1-indexed standings position at the time the bracket was seeded. */
  rank: number
}

type Pairing = [BracketTeam, BracketTeam]

/** Needs exactly 8 seeds, ordered 1st through 8th. */
export function quarterfinalMatchups(
  seeds: BracketTeam[]
): [Pairing, Pairing, Pairing, Pairing] {
  if (seeds.length !== 8) {
    throw new Error('quarterfinalMatchups needs exactly 8 seeds')
  }
  return [
    [seeds[0], seeds[7]], // 1st v 8th
    [seeds[1], seeds[6]], // 2nd v 7th
    [seeds[2], seeds[5]], // 3rd v 6th
    [seeds[3], seeds[4]], // 4th v 5th
  ]
}

/**
 * `qfWinners` are the four quarterfinal winners, in the same order as the
 * pairings `quarterfinalMatchups` returned them in (1v8, 2v7, 3v6, 4v5).
 */
export function semifinalMatchups(
  qfWinners: [BracketTeam, BracketTeam, BracketTeam, BracketTeam]
): [Pairing, Pairing] {
  const [win18, win27, win36, win45] = qfWinners
  return [
    [win18, win45],
    [win27, win36],
  ]
}

/** `sfWinners` are the two semifinal winners, in either order. */
export function finalMatchup(sfWinners: Pairing): Pairing {
  return sfWinners
}
