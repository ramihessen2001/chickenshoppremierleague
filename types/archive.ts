/**
 * Season archive types -- a read-only snapshot of a past season, kept
 * separate from the live tables. See database/migrations/012_archive.sql.
 */

export interface ArchiveSeason {
  id: string
  label: string
  archivedAt: string
}

export interface ArchiveStanding {
  teamId: string
  teamName: string
  /** Always the full name for archived seasons: `archive_teams` has no
   *  short_name column, so the builder falls back. */
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

export interface ArchiveGame {
  id: string
  gameNumber: number | null
  weekNumber: number | null
  date: string
  time: string
  location: string | null
  homeTeamName: string
  awayTeamName: string
  homeTeamSlug: string | null
  awayTeamSlug: string | null
  homeScore: number | null
  awayScore: number | null
  status: string | null
  isPlayoff: boolean
  playoffRound: string | null
}
