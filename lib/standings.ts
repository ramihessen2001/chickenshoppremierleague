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
