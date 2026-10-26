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
  getGameById,
  getGamesByWeek,
  getLeagueConfig,
  getStandings,
  getStatLeaders,
  getTeamBySlug,
  getTeams,
  getTeamsWithPlayers,
} from '../supabaseData'
import { supabaseAdmin } from '../supabaseAdmin'
import { LEAGUE } from '@/config/league'
import { Game } from '@/types/game'
import {
  AWARD_KINDS,
  AWARD_LABELS,
  AWARD_RACE_MAX,
  AWARD_RACE_MIN,
  AwardKind,
  AwardRaceGraphic,
  GraphicClub,
  MatchdayGraphic,
  ThumbnailGraphic,
  POWER_RANKING_BLURB_MAX,
  PowerRankingsGraphic,
  ResultsGraphic,
  STORY_COUNT_MAX,
  STORY_COUNT_MIN,
  STORY_LIMITS,
  StoryGraphic,
  WeekCoverGraphic,
  SlateGraphic,
  StatLeadersGraphic,
  TableGraphic,
  TotwGraphic,
  TotwLine,
  YOUNG_PLAYER_MAX_AGE,
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

/** "Saturday" and "10 October" for a YYYY-MM-DD date. */
function dayLabels(iso: string) {
  const when = parseLocalDate(iso)
  return {
    weekday: when.toLocaleDateString('en-US', { weekday: 'long' }),
    date: when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
  }
}

/**
 * A club as a fixture shows it: name, crest slug, and where it sits in the
 * table ("6th · 1 pt") once it has played -- null before its first game.
 */
function sideMaker(
  standings: Awaited<ReturnType<typeof getStandings>>,
  clubs: Map<string, GraphicClub>
) {
  const standingOf = new Map(
    standings.map((row, index) => [
      row.teamSlug,
      row.gamesPlayed > 0
        ? `${ordinal(index + 1)} · ${row.points} ${row.points === 1 ? 'pt' : 'pts'}`
        : null,
    ])
  )
  return (slug: string) => ({
    ...(clubs.get(slug) ?? { slug, name: 'TBD' }),
    standing: standingOf.get(slug) ?? null,
  })
}

/** The matchday story for one game. */
export async function buildMatchday(gameId: string): Promise<MatchdayGraphic> {
  const [game, standings, clubs, season] = await Promise.all([
    getGameById(gameId),
    getStandings(),
    clubDirectory(),
    seasonLabel(),
  ])
  if (!game) throw new GraphicInputError(`No game with id ${gameId}.`)
  if (!game.homeTeamId || !game.awayTeamId) {
    throw new GraphicInputError('That game does not have both clubs set yet.')
  }

  const side = sideMaker(standings, clubs)
  return {
    type: 'matchday',
    season,
    week: game.weekNumber,
    ...dayLabels(game.date),
    slot: game.time,
    venue: game.location || 'ICNEF',
    home: side(game.homeTeamId),
    away: side(game.awayTeamId),
  }
}

/**
 * A matchweek's results: every completed game with its score and man of the
 * match, by day. With no week given, the last week with a completed game.
 */
export async function buildResults(week?: number): Promise<ResultsGraphic> {
  const [games, clubs, season] = await Promise.all([getAllGames(), clubDirectory(), seasonLabel()])
  const chosenWeek = week ?? lastCompletedWeek(games)
  if (chosenWeek === null) {
    throw new GraphicInputError('No game has been completed yet, so there are no results to show.')
  }

  const played = games
    .filter(
      (g) =>
        g.weekNumber === chosenWeek &&
        g.status === 'completed' &&
        g.homeScore !== null &&
        g.awayScore !== null
    )
    .sort((a, b) => a.date.localeCompare(b.date) || slotRank(a.time) - slotRank(b.time))
  if (played.length === 0) {
    throw new GraphicInputError(`Matchweek ${chosenWeek} has no completed games to show.`)
  }

  const days: ResultsGraphic['days'] = []
  for (const game of played) {
    const { weekday, date } = dayLabels(game.date)
    let day = days.find((d) => d.date === date)
    if (!day) {
      day = { weekday, date, games: [] }
      days.push(day)
    }
    day.games.push({
      slot: game.time,
      home: clubs.get(game.homeTeamId) ?? { slug: game.homeTeamId, name: 'TBD' },
      away: clubs.get(game.awayTeamId) ?? { slug: game.awayTeamId, name: 'TBD' },
      homeScore: game.homeScore as number,
      awayScore: game.awayScore as number,
      motm: game.playerOfGame?.name ?? null,
    })
  }
  return { type: 'results', season, week: chosenWeek, days }
}

/** Earlier slots first within a day. */
const SLOT_ORDER = ['assr', 'maghrib', "isha'a"]
const slotRank = (slot: string) => {
  // The apostrophe in Isha'a may be straight or curly depending on who typed it.
  const rank = SLOT_ORDER.indexOf(slot.trim().toLowerCase().replace(/[’‘`]/g, "'"))
  return rank === -1 ? SLOT_ORDER.length : rank
}

/**
 * A matchday story for every game of one matchweek, in the order they are
 * played. With no week given, the current matchweek (the league's setting),
 * or the next week with a game still to play if that one has none. Cancelled
 * and postponed games are left out, as are games that do not have both clubs
 * set yet -- `skipped` counts those so the caller can say so.
 */
export async function buildMatchdayWeek(
  week?: number
): Promise<{ week: number; stories: MatchdayGraphic[]; skipped: number }> {
  const [games, standings, config, clubs] = await Promise.all([
    getAllGames(),
    getStandings(),
    getLeagueConfig(),
    clubDirectory(),
  ])

  const currentWeek = config?.current_week ?? 1
  const hasGames = (w: number) =>
    games.some((g) => g.weekNumber === w && g.status !== 'cancelled' && g.status !== 'postponed')
  const chosenWeek =
    week ??
    (hasGames(currentWeek)
      ? currentWeek
      : games
          .filter((g) => g.weekNumber > currentWeek && g.status === 'scheduled')
          .map((g) => g.weekNumber)
          .sort((a, b) => a - b)[0]) ??
    currentWeek

  const fixtures = games
    .filter((g) => g.weekNumber === chosenWeek && g.status !== 'cancelled' && g.status !== 'postponed')
    .sort((a, b) => a.date.localeCompare(b.date) || slotRank(a.time) - slotRank(b.time))
  if (fixtures.length === 0) {
    throw new GraphicInputError(`Matchweek ${chosenWeek} has no games to make stories for.`)
  }

  const side = sideMaker(standings, clubs)
  const season = config?.season ?? LEAGUE.fallbackSeason
  const ready = fixtures.filter((g) => g.homeTeamId && g.awayTeamId)
  return {
    week: chosenWeek,
    skipped: fixtures.length - ready.length,
    stories: ready.map((game) => ({
      type: 'matchday' as const,
      season,
      week: game.weekNumber,
      ...dayLabels(game.date),
      slot: game.time,
      venue: game.location || 'ICNEF',
      home: side(game.homeTeamId),
      away: side(game.awayTeamId),
    })),
  }
}

/**
 * A YouTube thumbnail for every matchday of one matchweek -- one per date,
 * each listing that day's games in the order they are played. The week is
 * chosen as for the matchday stories: the one named, else the current
 * matchweek, else the next with a game to play. Games without both clubs set
 * are left out and counted in `skipped`; a day left with no games gets no
 * thumbnail.
 */
export async function buildThumbnailWeek(
  week?: number
): Promise<{ week: number; thumbnails: ThumbnailGraphic[]; skipped: number }> {
  const [games, config, clubs] = await Promise.all([getAllGames(), getLeagueConfig(), clubDirectory()])

  const currentWeek = config?.current_week ?? 1
  const playable = (g: Game) => g.status !== 'cancelled' && g.status !== 'postponed'
  const hasGames = (w: number) => games.some((g) => g.weekNumber === w && playable(g))
  const chosenWeek =
    week ??
    (hasGames(currentWeek)
      ? currentWeek
      : games
          .filter((g) => g.weekNumber > currentWeek && g.status === 'scheduled')
          .map((g) => g.weekNumber)
          .sort((a, b) => a - b)[0]) ??
    currentWeek

  const fixtures = games
    .filter((g) => g.weekNumber === chosenWeek && playable(g))
    .sort((a, b) => a.date.localeCompare(b.date) || slotRank(a.time) - slotRank(b.time))
  if (fixtures.length === 0) {
    throw new GraphicInputError(`Matchweek ${chosenWeek} has no games to make thumbnails for.`)
  }

  const club = (slug: string) => clubs.get(slug) ?? { slug, name: 'TBD' }
  const ready = fixtures.filter((g) => g.homeTeamId && g.awayTeamId)
  const season = config?.season ?? LEAGUE.fallbackSeason
  const thumbnails: ThumbnailGraphic[] = []
  for (const game of ready) {
    let day = thumbnails.find((t) => t.date === dayLabels(game.date).date)
    if (!day) {
      day = { type: 'thumbnail', season, week: chosenWeek, ...dayLabels(game.date), games: [] }
      thumbnails.push(day)
    }
    day.games.push({ slot: game.time, home: club(game.homeTeamId), away: club(game.awayTeamId) })
  }
  return { week: chosenWeek, thumbnails, skipped: fixtures.length - ready.length }
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

  // Chronological: by day, and within a day Maghrib before Isha'a.
  const fixtures = games
    // Postponed games are waiting for a new date, so they are not this
    // weekend's fixtures.
    .filter((g) => g.weekNumber === chosenWeek && g.status !== 'cancelled' && g.status !== 'postponed')
    .sort((a, b) => a.date.localeCompare(b.date) || slotRank(a.time) - slotRank(b.time))
  if (fixtures.length === 0) {
    throw new GraphicInputError(`Week ${chosenWeek} has no fixtures to show.`)
  }

  const side = sideMaker(standings, clubs)

  const days: SlateGraphic['days'] = []
  for (const game of fixtures) {
    const { weekday, date } = dayLabels(game.date)
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

/** What the agent hands over for power rankings: every club, best first. */
export interface PowerRankingsInput {
  week: number
  ranking: { club: string; blurb: string }[]
}

/**
 * Power rankings from the agent's order and verdicts. Checks every club is
 * ranked exactly once and each verdict fits, then adds what is fact: each
 * club's record and points from the table, and how far it has moved since
 * the last power rankings the media team approved.
 */
export async function buildPowerRankings(input: PowerRankingsInput): Promise<PowerRankingsGraphic> {
  const [teams, standings, season, previous] = await Promise.all([
    getTeams(),
    getStandings(),
    seasonLabel(),
    lastApprovedPowerRankings(),
  ])

  const findTeam = (club: string) =>
    teams.find((t) =>
      [t.slug, t.name, t.short_name ?? ''].some((v) => normalise(v) === normalise(club))
    )

  const ranked = input.ranking.map((entry) => {
    const team = findTeam(entry.club)
    if (!team) throw new GraphicInputError(`No club called "${entry.club}".`)
    const blurb = entry.blurb.trim()
    if (!blurb) throw new GraphicInputError(`${team.name} needs a verdict.`)
    if (blurb.length > POWER_RANKING_BLURB_MAX) {
      throw new GraphicInputError(
        `The verdict for ${team.name} is ${blurb.length} characters; keep each under ${POWER_RANKING_BLURB_MAX}.`
      )
    }
    return { team, blurb }
  })

  const slugs = ranked.map((r) => r.team.slug)
  const missing = teams.filter((t) => !slugs.includes(t.slug)).map((t) => t.name)
  if (new Set(slugs).size !== slugs.length) {
    throw new GraphicInputError('A club is ranked twice; rank each club exactly once.')
  }
  if (missing.length > 0) {
    throw new GraphicInputError(`Every club must be ranked. Missing: ${missing.join(', ')}.`)
  }

  const standingOf = new Map(standings.map((row) => [row.teamSlug, row]))
  return {
    type: 'power_rankings',
    season,
    week: input.week,
    rows: ranked.map(({ team, blurb }, index) => {
      const row = standingOf.get(team.slug)
      const before = previous?.get(team.slug)
      return {
        rank: index + 1,
        club: { slug: team.slug, name: team.short_name || team.name },
        record: `${row?.wins ?? 0}-${row?.draws ?? 0}-${row?.losses ?? 0}`,
        points: row?.points ?? 0,
        blurb,
        movement: before === undefined ? null : before - (index + 1),
      }
    }),
  }
}

/** Club slug -> rank in the newest approved power rankings, or null if there are none. */
async function lastApprovedPowerRankings(): Promise<Map<string, number> | null> {
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .select('graphic')
    .eq('status', 'approved')
    .filter('graphic->>type', 'eq', 'power_rankings')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error || !data?.graphic) return null
  const last = data.graphic as PowerRankingsGraphic
  return new Map(last.rows.map((row) => [row.club.slug, row.rank]))
}

// ---------------------------------------------------------------------------
// Award races
// ---------------------------------------------------------------------------

/** One player's season so far, with the facts an award is judged on. */
export interface AwardPoolEntry {
  player: string
  club: GraphicClub
  position: string
  goals: number
  assists: number
  saves: number
  /** The club's, not the player's. */
  clubCleanSheets: number
  clubGoalsAgainst: number
  /** Why they cannot be put forward for this award, or null when they can. */
  ineligible: string | null
  age: number | null
}

/**
 * Every active player with their season totals, from the completed games'
 * box scores, and whether they are eligible for `award`. Eligibility is the
 * only place age is used; it never appears on a graphic.
 */
async function awardPool(award: AwardKind): Promise<AwardPoolEntry[]> {
  const [teams, games, standings] = await Promise.all([
    getTeamsWithPlayers(),
    getAllGames(),
    getStandings(),
  ])
  const completed = games.filter((g) => g.status === 'completed')

  const totals = new Map<string, { goal: number; assist: number; save: number }>()
  for (const game of completed) {
    for (const stat of game.statistics) {
      if (stat.type !== 'goal' && stat.type !== 'assist' && stat.type !== 'save') continue
      const entry = totals.get(stat.playerId) ?? { goal: 0, assist: 0, save: 0 }
      entry[stat.type] += stat.count ?? 1
      totals.set(stat.playerId, entry)
    }
  }

  const cleanSheets = (slug: string) =>
    completed.filter(
      (g) =>
        (g.homeTeamId === slug && g.awayScore === 0) || (g.awayTeamId === slug && g.homeScore === 0)
    ).length
  const against = new Map(standings.map((row) => [row.teamSlug, row.goalsAgainst]))

  const pool: AwardPoolEntry[] = []
  for (const team of teams) {
    const club = { slug: team.slug, name: team.short_name || team.name }
    for (const player of team.players.filter((p) => p.is_active)) {
      const stats = totals.get(player.id) ?? { goal: 0, assist: 0, save: 0 }
      const position = (player.position ?? '').trim()
      const age = player.age ?? null

      let ineligible: string | null = null
      if (award === 'young_player') {
        if (age === null) ineligible = 'has no age on record, so cannot be checked for the Young Player award'
        else if (age > YOUNG_PLAYER_MAX_AGE) ineligible = 'is too old for the Young Player award'
      } else if (award === 'best_keeper') {
        if (normalise(position) !== 'goalkeeper' && stats.save === 0) ineligible = 'is not a goalkeeper'
      } else if (award === 'best_defender') {
        if (normalise(position) !== 'defender') ineligible = 'is not a defender'
      }

      pool.push({
        player: player.name,
        club,
        position: position || 'Flexible',
        goals: stats.goal,
        assists: stats.assist,
        saves: stats.save,
        clubCleanSheets: cleanSheets(team.slug),
        clubGoalsAgainst: against.get(team.slug) ?? 0,
        ineligible,
        age,
      })
    }
  }
  return pool
}

/**
 * The players the content agent should weigh for an award, with their season
 * totals: only those eligible, best first by the award's obvious measure
 * (goals and assists; saves; the club's clean sheets), at most 20. Age is
 * left out -- the agent never needs it, only the eligibility it decides.
 */
export async function awardCandidates(award: AwardKind) {
  const pool = (await awardPool(award)).filter((e) => !e.ineligible)
  const score = (e: AwardPoolEntry) =>
    award === 'best_keeper'
      ? e.saves
      : award === 'best_defender'
        ? e.clubCleanSheets * 100 - e.clubGoalsAgainst
        : e.goals + e.assists
  return pool
    .filter((e) => award === 'best_defender' || award === 'best_keeper' || e.goals + e.assists + e.saves > 0)
    .sort((a, b) => score(b) - score(a) || a.player.localeCompare(b.player))
    .slice(0, 20)
    .map((e) => ({
      player: e.player,
      club: e.club,
      position: e.position,
      goals: e.goals,
      assists: e.assists,
      saves: e.saves,
      clubCleanSheets: e.clubCleanSheets,
      clubGoalsAgainst: e.clubGoalsAgainst,
    }))
}

/** What the agent hands over for an award race: the candidates, best first. */
export interface AwardRaceInput {
  award: AwardKind
  candidates: { player: string; club: string }[]
}

/**
 * An award race from the agent's order. Checks each candidate is a real,
 * eligible player on the club named, then adds what is fact: their goals,
 * assists, saves and the club figures the award is read against.
 */
export async function buildAwardRace(input: AwardRaceInput): Promise<AwardRaceGraphic> {
  if (!AWARD_KINDS.includes(input.award)) {
    throw new GraphicInputError(`award must be one of: ${AWARD_KINDS.join(', ')}.`)
  }
  const count = input.candidates.length
  if (count < AWARD_RACE_MIN || count > AWARD_RACE_MAX) {
    throw new GraphicInputError(
      `An award race shows ${AWARD_RACE_MIN} to ${AWARD_RACE_MAX} candidates; you gave ${count}.`
    )
  }

  const [pool, teams, games, season] = await Promise.all([
    awardPool(input.award),
    getTeams(),
    getAllGames(),
    seasonLabel(),
  ])
  const findTeam = (club: string) =>
    teams.find((t) =>
      [t.slug, t.name, t.short_name ?? ''].some((v) => normalise(v) === normalise(club))
    )

  const entries = input.candidates.map((candidate) => {
    const team = findTeam(candidate.club)
    if (!team) throw new GraphicInputError(`No club called "${candidate.club}".`)
    const entry = pool.find(
      (e) => e.club.slug === team.slug && normalise(e.player) === normalise(candidate.player)
    )
    if (!entry) {
      throw new GraphicInputError(
        `"${candidate.player}" is not on ${team.name}'s roster. Use get_award_candidates for exact names.`
      )
    }
    if (entry.ineligible) {
      throw new GraphicInputError(
        `${entry.player} ${entry.ineligible}. Choose from get_award_candidates for ${AWARD_LABELS[input.award]}.`
      )
    }
    return entry
  })
  if (new Set(entries.map((e) => `${e.club.slug}|${normalise(e.player)}`)).size !== entries.length) {
    throw new GraphicInputError('The same player is listed twice.')
  }

  const figures = (e: AwardPoolEntry) => {
    if (input.award === 'best_keeper') {
      return [
        { label: 'Saves', value: e.saves },
        { label: 'CS', value: e.clubCleanSheets },
        { label: 'GA', value: e.clubGoalsAgainst },
      ]
    }
    if (input.award === 'best_defender') {
      return [
        { label: 'CS', value: e.clubCleanSheets },
        { label: 'GA', value: e.clubGoalsAgainst },
        { label: 'G+A', value: e.goals + e.assists },
      ]
    }
    return [
      { label: 'Goals', value: e.goals },
      { label: 'Assists', value: e.assists },
      { label: 'G+A', value: e.goals + e.assists },
    ]
  }

  return {
    type: 'award_race',
    season,
    award: input.award,
    afterWeek: lastCompletedWeek(games),
    legend:
      input.award === 'best_keeper'
        ? "CS clean sheets · GA goals against (both are the club's)"
        : input.award === 'best_defender'
          ? "CS clean sheets · GA goals against (both are the club's) · G+A goals plus assists"
          : null,
    rows: entries.map((e, index) => ({
      rank: index + 1,
      player: e.player,
      club: e.club,
      stats: figures(e),
    })),
  }
}

// ---------------------------------------------------------------------------
// "This Week in CSPL": the cover and the story slides
// ---------------------------------------------------------------------------

/** A figure's value: a number, a signed number, a score or a percentage. */
export const FIGURE_VALUE = /^[+\-−]?\d[\d.,:/–-]*%?$/

/** What the agent hands over for one storyline. */
export interface StoryInput {
  label: string
  headline: string
  body: string
  mediaHint?: string
  /** A club (slug or name) the story is about, for its crest. */
  club?: string
  /** A game the story is about (from get_games): its scoreline is added for you. */
  gameId?: string
  stats?: { label: string; value: string }[]
}

/**
 * A story slide from the agent's input: checks the text fits and every name is
 * real, and adds what is fact -- the club's crest and the game's scoreline.
 * `index` and `count` are filled in once the whole list is known.
 */
export async function buildStory(
  input: StoryInput,
  week: number,
  mediaUrl: string | null = null
): Promise<Omit<StoryGraphic, 'index' | 'count'>> {
  const L = STORY_LIMITS
  const tooLong = (field: string, value: string, max: number) => {
    if (value.length > max) {
      throw new GraphicInputError(`The ${field} "${value}" is ${value.length} characters; keep it to ${max} or fewer.`)
    }
  }
  const label = input.label.trim()
  const headline = input.headline.trim()
  const body = input.body.trim()
  if (!label || !headline) throw new GraphicInputError('Every story needs a label and a headline.')
  tooLong('label', label, L.label)
  tooLong('headline', headline, L.headline)
  tooLong('body', body, L.body)
  const mediaHint = input.mediaHint?.trim() || null
  if (mediaHint) tooLong('media hint', mediaHint, L.mediaHint)

  const stats = (input.stats ?? []).map((s) => ({ label: s.label.trim(), value: String(s.value).trim() }))
  if (stats.length > L.stats) throw new GraphicInputError(`A story shows at most ${L.stats} figures.`)
  for (const s of stats) {
    tooLong('figure label', s.label, L.statLabel)
    tooLong('figure value', s.value, L.statValue)
    // A figure is a number or a score, big in its box; what it measures goes in the label.
    if (!FIGURE_VALUE.test(s.value)) {
      throw new GraphicInputError(
        `The figure value "${s.value}" must be just the number or score, like "4", "+9" or "2-1". Put what it measures, and whose, in the label, like "Rashid goals".`
      )
    }
  }

  const [teams, games, clubs, season] = await Promise.all([
    getTeams(),
    input.gameId ? getAllGames() : Promise.resolve([] as Game[]),
    clubDirectory(),
    seasonLabel(),
  ])

  let club: GraphicClub | null = null
  if (input.club) {
    const team = teams.find((t) =>
      [t.slug, t.name, t.short_name ?? ''].some((v) => normalise(v) === normalise(input.club as string))
    )
    if (!team) throw new GraphicInputError(`No club called "${input.club}".`)
    club = { slug: team.slug, name: team.short_name || team.name }
  }

  let game: StoryGraphic['game'] = null
  if (input.gameId) {
    const found = games.find((g) => g.id === input.gameId)
    if (!found) throw new GraphicInputError(`No game with id ${input.gameId}.`)
    if (found.status !== 'completed' || found.homeScore === null || found.awayScore === null) {
      throw new GraphicInputError('That game has not been completed, so it has no score to show.')
    }
    game = {
      home: clubs.get(found.homeTeamId) ?? { slug: found.homeTeamId, name: 'TBD' },
      away: clubs.get(found.awayTeamId) ?? { slug: found.awayTeamId, name: 'TBD' },
      homeScore: found.homeScore,
      awayScore: found.awayScore,
    }
  }

  return { type: 'story', season, week, label, headline, body, mediaHint, mediaUrl, club, game, stats }
}

/** Numbers a list of stories, checking there are enough and not too many. */
export function numberStories(
  stories: Omit<StoryGraphic, 'index' | 'count'>[],
  min = STORY_COUNT_MIN
): StoryGraphic[] {
  if (stories.length < min || stories.length > STORY_COUNT_MAX) {
    throw new GraphicInputError(`A week has ${min} to ${STORY_COUNT_MAX} stories; you gave ${stories.length}.`)
  }
  return stories.map((story, i) => ({ ...story, index: i + 1, count: stories.length }))
}

/**
 * The cover: every slide after it, in order -- the results, the table, each
 * story with its headline, and (when there is one) next week's slate last.
 */
export function buildWeekCover(
  week: number,
  season: string,
  stories: StoryGraphic[],
  hasSlate: boolean
): WeekCoverGraphic {
  const items: WeekCoverGraphic['items'] = [
    { slide: 2, label: 'Weekend Results', headline: null },
    { slide: 3, label: 'League Table', headline: null },
    ...stories.map((story, i) => ({ slide: i + 4, label: story.label, headline: story.headline })),
  ]
  if (hasSlate) items.push({ slide: stories.length + 4, label: "Next Week's Slate", headline: null })
  return { type: 'week_cover', season, week, items }
}

/** The matchweek a story from the media team's own photo is about: the latest with a completed game. */
export async function latestResultsWeek(): Promise<number> {
  const week = lastCompletedWeek(await getAllGames())
  if (week === null) throw new GraphicInputError('No game has been completed yet, so there is nothing to tell a story about.')
  return week
}
