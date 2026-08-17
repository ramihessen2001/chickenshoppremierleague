/**
 * Playoff bracket seeding for an 8-team field.
 *
 * The top 4 standings positions bye straight to the quarterfinals; the
 * bottom 4 play a knockout round for the last two spots. Pure and
 * dependency-free, like lib/draft.ts and lib/standings.ts, so the pairing
 * rules can be reasoned about (and tested) on their own, separate from the
 * database calls that turn them into games.
 *
 *   Play-in     5th v 8th, 6th v 7th
 *   Quarterfinals   1st v weaker play-in winner
 *                   2nd v stronger play-in winner
 *                   3rd v 4th
 *   Semifinal   the best-seeded of the 3 quarterfinal winners byes to the
 *               final; the other two play for the last spot
 *   Final       the semifinal bye vs the semifinal winner
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
export function playInMatchups(seeds: BracketTeam[]): [Pairing, Pairing] {
  if (seeds.length !== 8) {
    throw new Error('playInMatchups needs exactly 8 seeds')
  }
  return [
    [seeds[4], seeds[7]], // 5th v 8th
    [seeds[5], seeds[6]], // 6th v 7th
  ]
}

/** `playInWinners` are the two play-in survivors, in either order. */
export function quarterfinalMatchups(
  seeds: BracketTeam[],
  playInWinners: Pairing
): [Pairing, Pairing, Pairing] {
  if (seeds.length !== 8) {
    throw new Error('quarterfinalMatchups needs all 8 original seeds')
  }
  const [a, b] = playInWinners
  const weaker = a.rank > b.rank ? a : b
  const stronger = a.rank > b.rank ? b : a
  return [
    [seeds[0], weaker], // 1st v weaker play-in winner
    [seeds[1], stronger], // 2nd v stronger play-in winner
    [seeds[2], seeds[3]], // 3rd v 4th
  ]
}

/**
 * The best-seeded of the three quarterfinal winners has earned a bye
 * straight to the final; the other two meet for the last spot.
 */
export function semifinalMatchup(qfWinners: BracketTeam[]): {
  game: Pairing
  bye: BracketTeam
} {
  if (qfWinners.length !== 3) {
    throw new Error('semifinalMatchup needs exactly 3 quarterfinal winners')
  }
  const [bye, a, b] = [...qfWinners].sort((x, y) => x.rank - y.rank)
  return { game: [a, b], bye }
}
