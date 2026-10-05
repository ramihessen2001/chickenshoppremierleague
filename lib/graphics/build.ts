/**
 * Builds graphic snapshots from the league's data. SERVER ONLY.
 *
 * Every figure on a graphic is computed here from the database -- never taken
 * from the content agent. The table, stat leaders and slate need no input at
 * all. Team of the Week needs judgment, so the agent names the six players;
 * this file checks each one is a real player on that club, then works out
 * their stat lines from that week's box scores itself.
 */

import 'server-only'
import {
  getAllGames,
  getGamesByWeek,
  getLeagueConfig,
  getStandings,
  getStatLeaders,
  getTeamBySlug,
  getTeams,
} from '../supabaseData'
import { LEAGUE } from '@/config/league'
import { Game } from '@/types/game'
import {
  GraphicClub,
  SlateGraphic,
  StatLeadersGraphic,
  TableGraphic,
  TotwGraphic,
  TotwLine,
} from './spec'

/** Thrown for input the agent can fix -- the message goes back to it verbatim. */
export class GraphicInputError extends Error {}

/** Clubs by slug AND by database id: different reads identify clubs differently. */
async function clubDirectory(): Promise<Map<string, GraphicClub>> {
  const teams = await getTeams()
  const directory = new Map<string, GraphicClub>()
  for (const team of teams) {
    const club = { slug: team.slug, name: team.short_name || team.name }
    directory.set(team.slug, club)
    directory.set(team.id, club)
  }
  return directory
}

async function seasonLabel(): Promise<string> {
  return (await getLeagueConfig())?.season ?? LEAGUE.fallbackSeason
}

/** The last regular-season week with a completed game, or null before any. */
function lastCompletedWeek(games: Game[]): number | null {
  const weeks = games
    .filter((g) => g.status === 'completed' && g.weekNumber > 0)
    .map((g) => g.weekNumber)
  return weeks.length > 0 ? Math.max(...weeks) : null
}

function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** "2026-10-23" -> local date, without the UTC shift `new Date(iso)` applies. */
function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export async function buildTable(): Promise<TableGraphic> {
  const [standings, games, season] = await Promise.all([
    getStandings(),
    getAllGames(),
    seasonLabel(),
  ])
  return {
    type: 'table',
    season,
    afterWeek: lastCompletedWeek(games),
    rows: standings.map((row, index) => ({
      position: index + 1,
      club: { slug: row.teamSlug, name: row.teamShortName || row.teamName },
      played: row.gamesPlayed,
      won: row.wins,
      drawn: row.draws,
      lost: row.losses,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
    })),
  }
}

export async function buildStatLeaders(): Promise<StatLeadersGraphic> {
  const [goals, assists, saves, clubs, games, season] = await Promise.all([
    getStatLeaders('goal', 5),
    getStatLeaders('assist', 5),
    getStatLeaders('save', 5),
    clubDirectory(),
    getAllGames(),
    seasonLabel(),
  ])

  const category = (label: string, leaders: typeof goals) => ({
    label,
    rows: leaders.map((entry) => {
      const firstWithTotal = leaders.findIndex((other) => other.count === entry.count)
      const shared = leaders.filter((other) => other.count === entry.count).length > 1
      return {
        rank: `${shared ? '=' : ''}${firstWithTotal + 1}`,
        player: entry.player.name,
        club: clubs.get(entry.player.teamId) ?? { slug: '', name: '' },
        total: entry.count,
      }
    }),
  })

  return {
    type: 'stat_leaders',
    season,
    afterWeek: lastCompletedWeek(games),
    categories: [
      category('Goals', goals),
      category('Assists', assists),
      category('Saves', saves),
    ],
  }
}

/**
 * The fixtures for one week, grouped by day. With no week given, the next
 * week from the current one that still has a game to play.
 */
export async function buildSlate(week?: number): Promise<SlateGraphic> {
  const [games, standings, config, clubs] = await Promise.all([
    getAllGames(),
    getStandings(),
    getLeagueConfig(),
    clubDirectory(),
  ])

  const currentWeek = config?.current_week ?? 1
  const chosenWeek =
    week ??
    games
      .filter((g) => g.weekNumber >= currentWeek && g.status === 'scheduled')
      .map((g) => g.weekNumber)
      .sort((a, b) => a - b)[0] ??
    currentWeek

  const fixtures = games.filter(
    (g) => g.weekNumber === chosenWeek && g.status !== 'cancelled'
  )
  if (fixtures.length === 0) {
    throw new GraphicInputError(`Week ${chosenWeek} has no fixtures to show.`)
  }

  const standingOf = new Map(
    standings.map((row, index) => [
      row.teamSlug,
      row.gamesPlayed > 0
        ? `${ordinal(index + 1)} · ${row.points} ${row.points === 1 ? 'pt' : 'pts'}`
        : null,
    ])
  )
  const side = (slug: string) => ({
    ...(clubs.get(slug) ?? { slug, name: 'TBD' }),
    standing: standingOf.get(slug) ?? null,
  })

  const days: SlateGraphic['days'] = []
  for (const game of fixtures) {
    const when = parseLocalDate(game.date)
    const weekday = when.toLocaleDateString('en-US', { weekday: 'long' })
    const date = when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    let day = days.find((d) => d.date === date)
    if (!day) {
      day = { weekday, date, games: [] }
      days.push(day)
    }
    day.games.push({ slot: game.time, home: side(game.homeTeamId), away: side(game.awayTeamId) })
  }

  return {
    type: 'slate',
    season: config?.season ?? LEAGUE.fallbackSeason,
    week: chosenWeek,
    venue: fixtures[0].location || 'ICNEF',
    days,
  }
}

/** What the agent hands over for a Team of the Week. */
export interface TotwInput {
  week: number
  picks: { line: TotwLine; player: string; club: string }[]
  playerOfTheWeek: { player: string; club: string }
}

const FORMATION: TotwLine[] = ['FWD', 'MID', 'MID', 'DEF', 'DEF', 'GK']
const LINE_NAMES: Record<TotwLine, string> = {
  GK: 'Goalkeeper',
  DEF: 'Defender',
  MID: 'Midfielder',
  FWD: 'Forward',
}

const normalise = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

export async function buildTotw(input: TotwInput): Promise<TotwGraphic> {
  const lines = [...input.picks.map((p) => p.line)].sort()
  if (lines.join() !== [...FORMATION].sort().join()) {
    throw new GraphicInputError(
      'A Team of the Week is exactly 1 FWD, 2 MID, 2 DEF and 1 GK.'
    )
  }

  const [teams, weekGames, season] = await Promise.all([
    getTeams(),
    getGamesByWeek(input.week),
    seasonLabel(),
  ])
  const completed = weekGames.filter((g) => g.status === 'completed')
  if (completed.length === 0) {
    throw new GraphicInputError(`Week ${input.week} has no completed games yet.`)
  }

  // Accept a club by slug, full name or short name.
  const findTeam = (club: string) =>
    teams.find((t) =>
      [t.slug, t.name, t.short_name ?? ''].some((v) => normalise(v) === normalise(club))
    )

  // Week totals per player, from the box scores.
  const totals = new Map<string, { goal: number; assist: number; save: number }>()
  for (const game of completed) {
    for (const stat of game.statistics) {
      if (stat.type !== 'goal' && stat.type !== 'assist' && stat.type !== 'save') continue
      const entry = totals.get(stat.playerId) ?? { goal: 0, assist: 0, save: 0 }
      entry[stat.type] += stat.count ?? 1
      totals.set(stat.playerId, entry)
    }
  }

  const cleanSheet = (slug: string) =>
    completed.some(
      (g) =>
        (g.homeTeamId === slug && g.awayScore === 0) ||
        (g.awayTeamId === slug && g.homeScore === 0)
    )

  const rosters = new Map<string, Awaited<ReturnType<typeof getTeamBySlug>>>()
  const resolve = async (pick: { player: string; club: string }) => {
    const team = findTeam(pick.club)
    if (!team) throw new GraphicInputError(`No club called "${pick.club}".`)
    if (!rosters.has(team.slug)) rosters.set(team.slug, await getTeamBySlug(team.slug))
    const roster = (rosters.get(team.slug)?.players ?? []).filter((p) => p.is_active)
    const player = roster.find((p) => normalise(p.name) === normalise(pick.player))
    if (!player) {
      throw new GraphicInputError(
        `"${pick.player}" is not on ${team.name}'s roster. Their players: ${roster
          .map((p) => p.name)
          .join(', ')}.`
      )
    }
    return {
      player,
      club: { slug: team.slug, name: team.short_name || team.name },
      stats: totals.get(player.id) ?? { goal: 0, assist: 0, save: 0 },
    }
  }

  const resolved = await Promise.all(
    input.picks.map(async (pick) => ({ line: pick.line, ...(await resolve(pick)) }))
  )
  if (new Set(resolved.map((r) => r.player.id)).size !== resolved.length) {
    throw new GraphicInputError('The same player is picked twice.')
  }

  const statLine = (line: TotwLine, s: { goal: number; assist: number; save: number }, slug: string) => {
    const parts: string[] = []
    if (line === 'GK' && s.save > 0) parts.push(`${s.save} ${s.save === 1 ? 'Save' : 'Saves'}`)
    if (s.goal > 0) parts.push(`${s.goal}G`)
    if (s.assist > 0) parts.push(`${s.assist}A`)
    if (line !== 'GK' && s.save > 0) parts.push(`${s.save} ${s.save === 1 ? 'Save' : 'Saves'}`)
    if (parts.length === 0 && (line === 'GK' || line === 'DEF') && cleanSheet(slug)) {
      parts.push('Clean sheet')
    }
    return parts.join(' ')
  }

  // Pitch order, top to bottom, whatever order the agent listed them in.
  const picks = FORMATION.map((line) => {
    const index = resolved.findIndex((r) => r.line === line)
    const [pick] = resolved.splice(index, 1)
    return {
      line,
      player: pick.player.name,
      club: pick.club,
      statLine: statLine(line, pick.stats, pick.club.slug),
      playerId: pick.player.id,
      stats: pick.stats,
    }
  })

  const potwTeam = findTeam(input.playerOfTheWeek.club)
  const potw = picks.find(
    (p) =>
      normalise(p.player) === normalise(input.playerOfTheWeek.player) &&
      p.club.slug === potwTeam?.slug
  )
  if (!potw) {
    throw new GraphicInputError('The Player of the Week must be one of the six picks.')
  }

  return {
    type: 'totw',
    season,
    week: input.week,
    picks: picks.map(({ line, player, club, statLine }) => ({ line, player, club, statLine })),
    playerOfTheWeek: {
      player: potw.player,
      club: potw.club,
      position: LINE_NAMES[potw.line],
      stats: (
        [
          { label: 'Goals', value: potw.stats.goal },
          { label: 'Assists', value: potw.stats.assist },
          { label: 'Saves', value: potw.stats.save },
        ] as const
      )
        .filter((s) => s.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 2)
        .map((s) => ({ label: s.value === 1 ? s.label.slice(0, -1) : s.label, value: s.value })),
    },
  }
}
