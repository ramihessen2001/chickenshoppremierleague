/**
 * League table math.
 *
 * Pure and dependency-free so the ranking rule can be reasoned about (and
 * tested) on its own, the way lib/draft.ts keeps the snake order separate
 * from the database calls that use it.
 */

/** 3 for a win, 1 for a draw, 0 for a loss. */
export function calculatePoints(wins: number, draws: number): number {
  return wins * 3 + draws
}

export interface StandingsBuildTeam {
  id: string
  name: string
  /**
   * Table name, where the full one will not fit. Omitted or null means use
   * `name` -- which is also how archived seasons arrive, since `archive_teams`
   * predates the column.
   */
  shortName?: string | null
  slug: string
  logoUrl: string | null
}

export interface StandingsBuildGame {
  homeTeamId: string | null
  awayTeamId: string | null
  homeScore: number | null
  awayScore: number | null
}

export interface StandingsRow {
  teamId: string
  teamName: string
  /** What a results row should print. Falls back to the full name. */
  teamShortName: string
  teamSlug: string
  logoUrl: string | null
  gamesPlayed: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

/**
 * Builds the league table straight from completed games, so it can never
 * drift out of sync with the results the way a hand-entered copy could. The
 * caller decides which games count -- typically completed, non-playoff ones.
 */
export function buildStandings(
  teams: StandingsBuildTeam[],
  games: StandingsBuildGame[]
): StandingsRow[] {
  const byTeam = new Map<string, StandingsRow>()
  for (const team of teams) {
    byTeam.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      teamShortName: team.shortName || team.name,
      teamSlug: team.slug,
      logoUrl: team.logoUrl,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    })
  }

  for (const game of games) {
    if (game.homeScore === null || game.awayScore === null) continue
    const home = game.homeTeamId ? byTeam.get(game.homeTeamId) : undefined
    const away = game.awayTeamId ? byTeam.get(game.awayTeamId) : undefined

    if (home) {
      home.gamesPlayed += 1
      home.goalsFor += game.homeScore
      home.goalsAgainst += game.awayScore
    }
    if (away) {
      away.gamesPlayed += 1
      away.goalsFor += game.awayScore
      away.goalsAgainst += game.homeScore
    }

    if (game.homeScore > game.awayScore) {
      if (home) home.wins += 1
      if (away) away.losses += 1
    } else if (game.awayScore > game.homeScore) {
      if (away) away.wins += 1
      if (home) home.losses += 1
    } else {
      if (home) home.draws += 1
      if (away) away.draws += 1
    }
  }

  for (const row of byTeam.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst
    row.points = calculatePoints(row.wins, row.draws)
  }

  return rankStandings(Array.from(byTeam.values()))
}

/**
 * Ranks rows by points, then goal difference, then goals scored -- the usual
 * football tie-break order, only reached when points are level.
 */
export function rankStandings<
  T extends { points: number; goalDifference: number; goalsFor: number },
>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor
  )
}
