/**
 * Regular-season schedule generation.
 *
 * A single round-robin so each team plays every other team exactly once,
 * built with the "circle method": fix one team, rotate the rest. N teams
 * produces N-1 rounds of N/2 games each -- for 8 teams, 7 rounds of 4 games,
 * matching "each team plays once a week" over a 7-week season exactly.
 *
 * Pure and dependency-free, like lib/draft.ts and lib/bracket.ts, so the
 * pairing rule can be reasoned about on its own, separate from the database
 * calls and date arithmetic that turn it into real fixtures.
 */

export interface RoundRobinGame {
  round: number
  homeTeamId: string
  awayTeamId: string
}

/** `teamIds` needs an even length of 2 or more. */
export function roundRobinSchedule(teamIds: string[]): RoundRobinGame[] {
  if (teamIds.length < 2 || teamIds.length % 2 !== 0) {
    throw new Error('roundRobinSchedule needs an even number of teams (2 or more)')
  }

  const n = teamIds.length
  const fixed = teamIds[0]
  let rotating = teamIds.slice(1)
  const games: RoundRobinGame[] = []

  for (let round = 0; round < n - 1; round++) {
    const roundTeams = [fixed, ...rotating]
    for (let i = 0; i < n / 2; i++) {
      const a = roundTeams[i]
      const b = roundTeams[n - 1 - i]
      // Alternate which side is listed as "home" round to round, for balance.
      const [home, away] = round % 2 === 0 ? [a, b] : [b, a]
      games.push({ round: round + 1, homeTeamId: home, awayTeamId: away })
    }
    // Rotate everyone but the fixed team by one position.
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)]
  }

  return games
}

/** The Monday of the calendar week containing `date`, in local time. */
export function mondayOnOrBefore(date: Date): Date {
  const day = date.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? 6 : day - 1
  const monday = new Date(date)
  monday.setDate(date.getDate() - diff)
  return monday
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** "2026-09-28" -- built from local date parts, not toISOString(), which is UTC. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
