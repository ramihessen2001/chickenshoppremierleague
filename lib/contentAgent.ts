/**
 * The content agent behind the media team's desk. SERVER ONLY.
 *
 * Claude writes a draft from a brief, reading the league's own data through
 * the tools below, and can attach one of the league's graphics to it
 * (attach_graphic). No tool writes to the site: the agent cannot publish,
 * post or change anything. A draft only ever leaves the site when a person on the
 * media team approves it and copies it out, which is what makes the review
 * step a guarantee rather than an instruction the model is asked to follow.
 *
 * Facts come from the tools or not at all. The system prompt says so, and the
 * tools are the only source of league data the agent has -- no web access --
 * so a scoreline it cannot look up becomes a [PLACEHOLDER] for the media team
 * to fill, not a guess.
 */

import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { betaTool } from '@anthropic-ai/sdk/helpers/beta/json-schema'
import {
  getCommissionerPosts,
  getGameById,
  getGamesByWeek,
  getLeagueConfig,
  getStandings,
  getStatLeaders,
  getTeamBySlug,
  getTeams,
} from './supabaseData'
import { supabaseAdmin } from './supabaseAdmin'
import {
  buildSlate,
  buildStatLeaders,
  buildTable,
  buildTotw,
  GraphicInputError,
} from './graphics/build'
import { GRAPHIC_LABELS, GraphicSpec } from './graphics/spec'
import { LEAGUE } from '@/config/league'
import { Game } from '@/types/game'

const MODEL = 'claude-opus-5-5'

/**
 * The house style. Stable text only -- today's date and the brief go in the
 * user message -- so the whole prefix stays cacheable between drafts.
 */
const SYSTEM_PROMPT = `You write social media and newsletter content for the ${LEAGUE.name} (${LEAGUE.shortName}): a small-sided community soccer league for ages 14–25, played at the Islamic Center of Northeast Florida (ICNEF) in Jacksonville. Eight clubs, drafted from the players who signed up. Your drafts go to the league's media team, who edit and approve everything before it is posted.

# Voice: Fabrizio Romano, played completely straight

Write like the most breathless elite transfer journalist alive, covering a league that is played in a mosque's back field. The irony comes from the gap between the gravity of the delivery and the size of the stakes: a 3–2 win reported like a Champions League final, a mid-season trade treated as a world-record deal. Never wink at it or explain the joke. Deadpan is the whole bit.

The format is Romano's:
- Open with the headline in one line. "🚨" leads big news; "Here we go!" is reserved for things that are confirmed (a result, a completed deal, a pick).
- Then one fact per short paragraph. Spare, declarative, no filler.
- Close with a confirming line such as "Done deal. ✅" or "Full time. ✅" when it fits.
- Emoji sparingly, as punctuation: 🚨 ✅ and the odd one that earns its place. Not one per line.
- One or two ironic touches per post at most. If every line is a joke, none of them land.

An example of the house format (a completed trade):

🚨 [PLAYER A] to CSCP — here we go!

Agreement reached between S.C CAIRO and CENTRAL SPORTING CLUB OF PURO (CSCP).

[PLAYER B] makes the move in the opposite direction, joining S.C CAIRO.

Deal completed. ✅

# Who the jokes are about

Many players are under 18, and their families follow these accounts. Aim the irony at situations, at the league's self-importance, and at the drama of the table — never at an individual player's ability, body, background or mistakes. A goalkeeper who conceded six is "having a difficult evening", not a punchline. No profanity, nothing a parent would wince at.

# Facts

- Every score, scorer, assist, save, standing, fixture, date and name must come from your tools. Look things up before writing; do not rely on anything else.
- Spell player and club names exactly as the data does. CSCP is the accepted short name for Central Sporting Club Of PURO; other clubs go by their names (S.C Cairo, S.C Dakar, and so on).
- If something the brief needs is missing — no completed games yet, an unrecorded stat — write a placeholder in square brackets, like [SCORER] or [KICKOFF TIME], so the media team can see what to fill in. Never guess.
- Never invent quotes from real people. Obvious comic hyperbole is fine only where no reader could mistake it for a reported fact.
- Fixtures are played in prayer-time slots (Maghrib, Isha'a, Assr) rather than at clock times; use the slot the data gives.
- Do not mention players' ages.

# Pictures

The league posts four graphics, each a 1080×1440 image: Team of the Week, League Table, Stat Leaders and Matchweek Slate. When a brief is for one of them (or asks for a picture of one), call attach_graphic once so the draft carries the image, and write the caption to go with it.

- The table, stat leaders and slate are filled in from the database automatically; you only choose the type (and, for a slate, optionally the week).
- For Team of the Week, read that week's box scores first, then pick 1 FWD, 2 MID, 2 DEF and 1 GK, plus a Player of the Week from among the six. Prefer each player's registered position (get_club shows it). The tool checks every pick against the club's roster and works out the stat lines itself; if it reports a problem, fix the pick and call it again.
- The image already shows the numbers, so the caption should add the story rather than repeat every figure. Do not describe the image in the caption.
- If the tool says the data isn't there yet (no completed games, no fixtures), write the caption without a picture and say so in a bracketed note.

# Output

Return only the finished content, ready to paste: no preamble, no notes about how you wrote it, no markdown headings. If the brief asks for several pieces (for example a pick list and a caption, or a subject line and an email body), separate them with a line containing only ---. Instagram captions end with #CSPL unless the brief says otherwise.

Past approved drafts are the clearest guide to what the media team likes; check them when the brief matches a kind of post the league has made before.`

/**
 * Club display names keyed by slug AND database id, so tool results read in
 * names rather than ids. Both keys matter: games and box scores identify
 * clubs by slug, but the stat leaders read returns the team's database id.
 */
async function clubNames(): Promise<Map<string, string>> {
  const teams = await getTeams()
  const names = new Map<string, string>()
  for (const team of teams) {
    names.set(team.slug, team.short_name || team.name)
    names.set(team.id, team.short_name || team.name)
  }
  return names
}

/** A game as the agent sees it: names, not ids, and no raw stat rows. */
function summariseGame(game: Game, names: Map<string, string>) {
  return {
    gameId: game.id,
    week: game.weekNumber,
    date: game.date,
    slot: game.time,
    location: game.location,
    home: names.get(game.homeTeamId) ?? (game.homeTeamId || 'TBD'),
    away: names.get(game.awayTeamId) ?? (game.awayTeamId || 'TBD'),
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    status: game.status,
    playoffRound: game.playoffRound ?? null,
  }
}

const tools = [
  betaTool({
    name: 'get_league_overview',
    description:
      "The season's label, phase (signups, draft, season or playoffs), the current week and total weeks, and the list of clubs with their slugs. Call this first: the current week tells you which games 'this week' means.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () => {
      const [config, teams] = await Promise.all([getLeagueConfig(), getTeams()])
      return JSON.stringify({
        season: config?.season ?? LEAGUE.fallbackSeason,
        phase: config?.phase ?? 'season',
        currentWeek: config?.current_week ?? 1,
        totalWeeks: config?.total_weeks ?? null,
        clubs: teams.map((t) => ({
          slug: t.slug,
          name: t.name,
          shortName: t.short_name,
          sponsor: t.sponsor_name,
        })),
      })
    },
  }),

  betaTool({
    name: 'get_standings',
    description:
      'The league table as it stands, computed from completed games: position, club, played, won, drawn, lost, goals for and against, goal difference, points.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    run: async () => {
      const table = await getStandings()
      return JSON.stringify(
        table.map((row, index) => ({
          position: index + 1,
          club: row.teamShortName || row.teamName,
          played: row.gamesPlayed,
          won: row.wins,
          drawn: row.draws,
          lost: row.losses,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          goalDifference: row.goalDifference,
          points: row.points,
        }))
      )
    },
  }),

  betaTool({
    name: 'get_games',
    description:
      "Every game in one week: date, slot, clubs, score and status (scheduled, in_progress, completed, cancelled, postponed). Week 0 holds playoff games. Use get_box_score with a gameId for who scored.",
    inputSchema: {
      type: 'object',
      properties: {
        week: { type: 'integer', minimum: 0, description: 'Week number; 0 for playoffs.' },
      },
      required: ['week'],
      additionalProperties: false,
    },
    run: async ({ week }) => {
      const [games, names] = await Promise.all([getGamesByWeek(week), clubNames()])
      return JSON.stringify(games.map((g) => summariseGame(g, names)))
    },
  }),

  betaTool({
    name: 'get_box_score',
    description:
      "One game in full: the result plus every recorded goal, assist, save and card with the player's name, shirt number and club, and the player of the game.",
    inputSchema: {
      type: 'object',
      properties: { gameId: { type: 'string', description: 'From get_games.' } },
      required: ['gameId'],
      additionalProperties: false,
    },
    run: async ({ gameId }) => {
      const [game, names] = await Promise.all([getGameById(gameId), clubNames()])
      if (!game) return JSON.stringify({ error: `No game with id ${gameId}` })
      return JSON.stringify({
        ...summariseGame(game, names),
        events: game.statistics.map((s) => ({
          player: s.playerName ?? null,
          shirt: s.jerseyNumber ?? null,
          club: names.get(s.teamId) ?? s.teamId,
          type: s.type,
          count: s.count ?? 1,
        })),
        playerOfTheGame: game.playerOfGame?.name ?? null,
      })
    },
  }),

  betaTool({
    name: 'get_stat_leaders',
    description: 'Season leaders for goals, assists or saves, highest first.',
    inputSchema: {
      type: 'object',
      properties: {
        stat: { type: 'string', enum: ['goal', 'assist', 'save'] },
        limit: { type: 'integer', minimum: 1, maximum: 20 },
      },
      required: ['stat'],
      additionalProperties: false,
    },
    run: async ({ stat, limit }) => {
      const [leaders, names] = await Promise.all([
        getStatLeaders(stat, limit ?? 5),
        clubNames(),
      ])
      return JSON.stringify(
        leaders.map((entry) => ({
          player: entry.player.name,
          club: names.get(entry.player.teamId) ?? entry.player.teamId,
          total: entry.count,
        }))
      )
    },
  }),

  betaTool({
    name: 'get_club',
    description:
      "One club's details and active roster: player names, shirt numbers, positions and captains.",
    inputSchema: {
      type: 'object',
      properties: { slug: { type: 'string', description: 'From get_league_overview.' } },
      required: ['slug'],
      additionalProperties: false,
    },
    run: async ({ slug }) => {
      const team = await getTeamBySlug(slug)
      if (!team) return JSON.stringify({ error: `No club with slug ${slug}` })
      return JSON.stringify({
        name: team.name,
        shortName: team.short_name,
        sponsor: team.sponsor_name,
        // Ages are deliberately left out: nothing the desk writes needs them.
        roster: team.players
          .filter((p) => p.is_active)
          .map((p) => ({
            name: p.name,
            shirt: p.jersey_number,
            position: p.position ?? null,
            captain: p.is_captain,
          })),
      })
    },
  }),

  betaTool({
    name: 'get_recent_board_posts',
    description:
      "The latest commissioner's board posts on the site, newest first, so you know what has already been announced.",
    inputSchema: {
      type: 'object',
      properties: { limit: { type: 'integer', minimum: 1, maximum: 20 } },
      additionalProperties: false,
    },
    run: async ({ limit }) => {
      const posts = await getCommissionerPosts(limit ?? 5)
      return JSON.stringify(posts.map((p) => ({ postedAt: p.createdAt, body: p.body })))
    },
  }),

  betaTool({
    name: 'get_past_approved_drafts',
    description:
      'Drafts the media team approved before, newest first: the best guide to the house style. Filter by kind (match_report, weekly_roundup, totw, table, stat_leaders, slate, trade, board_post, newsletter, custom) to see past posts of the same type.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 10 },
      },
      additionalProperties: false,
    },
    run: async ({ kind, limit }) => {
      let query = supabaseAdmin
        .from('content_drafts')
        .select('kind, brief, body, created_at')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(limit ?? 3)
      if (kind) query = query.eq('kind', kind)
      const { data, error } = await query
      if (error) return JSON.stringify({ error: 'Could not read past drafts' })
      return JSON.stringify(data ?? [])
    },
  }),
]

/**
 * The one tool that does more than read: it attaches a graphic to the draft
 * being written. Made per draft, because what it attaches lives in this
 * closure until the draft is saved. It still publishes nothing -- the picture
 * goes to the review queue with the caption.
 */
function attachGraphicTool(onAttach: (spec: GraphicSpec) => void) {
  return betaTool({
    name: 'attach_graphic',
    description:
      "Attach one of the league's 1080x1440 graphics to this draft. table, stat_leaders and slate are built from the database (slate takes an optional week; without one it shows the next week with games to play). totw needs week, the six picks (1 FWD, 2 MID, 2 DEF, 1 GK) and playerOfTheWeek, who must be one of the picks; each pick is a player's exact name and their club (slug or name). Calling it again replaces the attached graphic.",
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['totw', 'table', 'stat_leaders', 'slate'] },
        week: { type: 'integer', minimum: 1 },
        picks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              line: { type: 'string', enum: ['GK', 'DEF', 'MID', 'FWD'] },
              player: { type: 'string' },
              club: { type: 'string' },
            },
            required: ['line', 'player', 'club'],
            additionalProperties: false,
          },
        },
        playerOfTheWeek: {
          type: 'object',
          properties: { player: { type: 'string' }, club: { type: 'string' } },
          required: ['player', 'club'],
          additionalProperties: false,
        },
      },
      required: ['type'],
      additionalProperties: false,
    },
    run: async (input) => {
      try {
        let spec: GraphicSpec
        if (input.type === 'table') spec = await buildTable()
        else if (input.type === 'stat_leaders') spec = await buildStatLeaders()
        else if (input.type === 'slate') spec = await buildSlate(input.week)
        else {
          if (!input.week || !input.picks || !input.playerOfTheWeek) {
            return 'Error: totw needs week, picks and playerOfTheWeek.'
          }
          spec = await buildTotw({
            week: input.week,
            picks: input.picks,
            playerOfTheWeek: input.playerOfTheWeek,
          })
        }
        onAttach(spec)
        return `Attached the ${GRAPHIC_LABELS[spec.type]} graphic. It shows: ${JSON.stringify(spec)}`
      } catch (error) {
        if (error instanceof GraphicInputError) return `Error: ${error.message}`
        throw error
      }
    },
  })
}

export class ContentAgentError extends Error {}

export interface WrittenDraft {
  text: string
  /** The attached picture, or null for a caption-only draft. */
  graphic: GraphicSpec | null
}

/**
 * Writes one draft for `brief`: the text, plus a graphic when the brief calls
 * for one. Throws a ContentAgentError with a message fit to show the media
 * team when the model declines or produces nothing, and lets SDK errors (rate
 * limits, a bad key) through for the route to classify.
 */
export async function writeDraft(brief: string, kind: string): Promise<WrittenDraft> {
  const client = new Anthropic()
  let graphic: GraphicSpec | null = null
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  })

  const message = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    // Opus 5.5 defaults to medium; set explicitly so a change in that default
    // never silently changes how much the desk spends per draft.
    output_config: { effort: 'medium' },
    // If a safety classifier declines, retry server-side on the model
    // Anthropic recommends for that case rather than failing the draft.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    cache_control: { type: 'ephemeral' },
    system: SYSTEM_PROMPT,
    tools: [
      ...tools,
      attachGraphicTool((spec) => {
        graphic = spec
      }),
    ],
    // A draft needs a handful of lookups; this only stops a runaway loop.
    max_iterations: 20,
    messages: [
      {
        role: 'user',
        content: `Today is ${today}. Kind of post: ${kind}.\n\nBrief from the media team:\n${brief}`,
      },
    ],
  })

  if (message.stop_reason === 'refusal') {
    throw new ContentAgentError(
      'The agent declined this brief. Try rewording it.'
    )
  }

  const text = message.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (!text) {
    throw new ContentAgentError('The agent finished without writing anything. Try again.')
  }
  if (message.stop_reason === 'max_tokens') {
    throw new ContentAgentError('The draft ran too long and was cut off. Ask for something shorter.')
  }
  return { text, graphic }
}
