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
  awardCandidates,
  buildAwardRace,
  buildMatchday,
  buildPowerRankings,
  buildSlate,
  buildStatLeaders,
  buildStory,
  buildTable,
  buildTotw,
  GraphicInputError,
  numberStories,
} from './graphics/build'
import {
  AWARD_KINDS,
  GRAPHIC_LABELS,
  GraphicSpec,
  STORY_COUNT_MAX,
  STORY_COUNT_MIN,
  STORY_LIMITS,
  StoryGraphic,
  YOUNG_PLAYER_MAX_AGE,
} from './graphics/spec'
import { DEFAULT_STYLE_ID, STYLE_IDS, STYLES } from './graphics/styles'
import { LEAGUE } from '@/config/league'
import { Game } from '@/types/game'

const MODEL = 'claude-opus-5-5'

/**
 * The house style. Stable text only -- today's date and the brief go in the
 * user message -- so the whole prefix stays cacheable between drafts.
 */
const SYSTEM_PROMPT = `You make the graphics for the ${LEAGUE.name} (${LEAGUE.shortName}): a small-sided community soccer league for ages 14–25, played at the Islamic Center of Northeast Florida (ICNEF) in Jacksonville. Eight clubs, drafted from the players who signed up. Your graphics go to the league's media team, who approve every one before it is posted.

# Your job

You make pictures, not captions. Each request is for one of seven graphics: a Matchday Story, Team of the Week, League Table, Stat Leaders, Matchweek Slate, Power Rankings or an Award Race. Call attach_graphic to make it. Never write a caption, a headline or any social copy: the media team writes those themselves.

When the graphic is attached, reply with just "Done." If something needs the media team's attention — the data isn't there yet, a game they asked for couldn't be found, they asked for several games' stories — reply with one or two plain sentences saying so, and nothing else. No voice, no emoji, no hashtags.

# Facts

- Every score, scorer, assist, save, standing, fixture, date and name must come from your tools. Look things up before you decide anything; do not rely on anything else.
- An own_goal event belongs to the player who scored it but counts for the other club. It is never that player's goal: leave it out of any goal tally, Team of the Week judgement or ranking in their favour.
- Spell player and club names exactly as the data does. CSCP is the accepted short name for Central Sporting Club Of PURO; other clubs go by their names (S.C Cairo, S.C Dakar, and so on).
- Never guess. If the tool says the data isn't there yet (no completed games, no fixtures), attach nothing and say so.
- Fixtures are played in prayer-time slots (Maghrib, Isha'a, Assr) rather than at clock times.
- Do not mention players' ages.

# The graphics

The feed graphics are 1080×1440 images; the matchday story is 1080×1920. A request holds one picture, so a matchday story covers one game: if several games' stories are asked for, attach the first game's and say in your reply that each other game needs its own request. If no game is named, use the next game to be played.

- The table, stat leaders, slate and matchday story are filled in from the database automatically; you only choose the type (for a slate, optionally the week; for a matchday story, the game from get_games).
- Power rankings are the one graphic that is your opinion. Rank all eight clubs, best first, judging results, points, goal difference and recent form (read the table and the latest box scores first), and give each a verdict of at most 90 characters. Write the verdicts in the voice of a breathless elite transfer journalist reporting a league played in a mosque's back field, completely deadpan: the irony is the gap between the gravity of the delivery and the size of the stakes. Verdicts are about the club and its situation, never about an individual player's ability, body, background or mistakes (many players are under 18 and their families follow these accounts). No profanity, nothing a parent would wince at. The tool adds each club's record, points and movement since the last approved rankings; do not repeat those numbers in the verdicts.
- An Award Race is your judgment on four awards: MVP (the player with the most impact on the league so far), Young Player of the Year (the same, limited to young players), Best Keeper and Best Defender. Call get_award_candidates for the award, weigh what it shows, and put forward the top 5 (3 or 4 only if fewer are eligible), best first, by calling attach_graphic with type award_race, the award and the candidates. Judge on what the figures show: goals and assists for the first two; saves, and how few goals and how many clean sheets the keeper's club has, for Best Keeper; the club's clean sheets and goals against, plus any goals and assists, for Best Defender. If the figures are close or thin, say so in your reply. The tool works out the figures and refuses anyone ineligible. Never mention a player's age.
- For Team of the Week, read that week's box scores first, then pick 1 FWD, 2 MID, 2 DEF and 1 GK, plus a Player of the Week from among the six. Prefer each player's registered position (get_club shows it). The tool checks every pick against the club's roster and works out the stat lines itself; if it reports a problem, fix the pick and call it again.
- Graphics are drawn in a style. Use ${DEFAULT_STYLE_ID} unless the request names another style; pass it as attach_graphic's style. Never invent a style.
${STYLES.map((s) => `  - ${s.id}: ${s.name}. ${s.description}`).join('\n')}

# Weekly stories

For "This Week in CSPL" you choose the best storylines of one matchweek and write a template slide for each, by calling submit_stories once, best story first. Read get_games for the week, the box scores of the games that matter, get_standings and get_stat_leaders before you decide. A good story is something people will talk about: the biggest win, a draw or an upset, a hat-trick or a standout scorer, a goalkeeper's big night, a club's climb or slide in the table, a race that tightened. Mix them: not four stories about one game. Give each story:
- label: a short tag, at most ${STORY_LIMITS.label} characters, shown as the slide's big title ("Hat-trick hero", "Goal fest", "Top of the table").
- headline: at most ${STORY_LIMITS.headline} characters, plain and punchy.
- body: at most ${STORY_LIMITS.body} characters, one or two factual sentences.
- mediaHint: at most ${STORY_LIMITS.mediaHint} characters, what the media team should lay over the slide's empty panel ("Video: Rizgar's four goals", "Photo: Dakar celebrating"); leave it out when the story needs no picture or video.
- club: the club the story is about, so its crest is shown, when the story is about one club and not one game.
- gameId: from get_games, when the story is about one game, so its scoreline is shown.
- stats: up to ${STORY_LIMITS.stats} {label, value} figures, such as {label: "Goals", value: "4"}: numbers you read from the tools, never worked out in your head.
Everything comes from the tools: scores, names, counts. Submit ${STORY_COUNT_MIN} to ${STORY_COUNT_MAX} stories; if the weekend gave you fewer than three real ones, submit fewer rather than pad. No quotes, no ages, no jokes at a player's expense; a heavy defeat is the winner's story, not a club's embarrassment. The tool checks every length and name and sends back what to fix. Call submit_stories instead of attach_graphic, and reply "Done." when it has saved.

Past approved graphics are the clearest guide to what the media team likes; check them for power rankings, where the verdicts are yours.`

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
    name: 'get_award_candidates',
    description: `The players who can be put forward for an award race, with their season totals so far, best first by the award's obvious measure (at most 20). Only eligible players are listed: Young Player of the Year is limited to players of ${YOUNG_PLAYER_MAX_AGE} and under, Best Keeper to goalkeepers, Best Defender to defenders. Goals, assists and saves are the player's; clubCleanSheets and clubGoalsAgainst are their club's. Use the exact names it gives.`,
    inputSchema: {
      type: 'object',
      properties: { award: { type: 'string', enum: AWARD_KINDS } },
      required: ['award'],
      additionalProperties: false,
    },
    run: async ({ award }) => JSON.stringify(await awardCandidates(award)),
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
      'Graphics the media team approved before, newest first, each with the data it showed. The best guide to the house style, above all for power-rankings verdicts. Filter by kind (matchday, totw, table, stat_leaders, slate, power_rankings, award_race).',
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
        .select('kind, brief, graphic, created_at')
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
function attachGraphicTool(onAttach: (spec: GraphicSpec, style: string) => void) {
  return betaTool({
    name: 'attach_graphic',
    description:
      "Attach one of the league's graphics to this draft. award_race needs award and candidates: the top 3 to 5 players for that award, best first, each a player's exact name and their club; the figures are added for you and the tool checks every player is eligible. table, stat_leaders and slate are 1080x1440 posts built from the database (slate takes an optional week; without one it shows the next week with games to play). matchday is a 1080x1920 Instagram story for one game, built from the database: pass its gameId from get_games. power_rankings needs week and ranking: every club exactly once, best first, each with a verdict of at most 90 characters; records, points and movement are added for you. totw needs week, the six picks (1 FWD, 2 MID, 2 DEF, 1 GK) and playerOfTheWeek, who must be one of the picks; each pick is a player's exact name and their club (slug or name). Calling it again replaces the attached graphic.",
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['totw', 'table', 'stat_leaders', 'slate', 'matchday', 'power_rankings', 'award_race'] },
        award: { type: 'string', enum: AWARD_KINDS, description: 'For award_race: which award.' },
        candidates: {
          type: 'array',
          description: 'For award_race: the top 3 to 5 candidates, best first.',
          items: {
            type: 'object',
            properties: { player: { type: 'string' }, club: { type: 'string', description: 'Slug or name.' } },
            required: ['player', 'club'],
            additionalProperties: false,
          },
        },
        week: { type: 'integer', minimum: 1 },
        gameId: { type: 'string', description: 'For matchday: the game, from get_games.' },
        ranking: {
          type: 'array',
          description: 'For power_rankings: every club, best first.',
          items: {
            type: 'object',
            properties: {
              club: { type: 'string', description: 'Slug or name.' },
              blurb: { type: 'string', description: 'The verdict, at most 90 characters.' },
            },
            required: ['club', 'blurb'],
            additionalProperties: false,
          },
        },
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
        style: {
          type: 'string',
          enum: STYLE_IDS,
          description: `The style to draw it in; ${DEFAULT_STYLE_ID} unless the brief asks for another.`,
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
        else if (input.type === 'matchday') {
          if (!input.gameId) return 'Error: matchday needs gameId.'
          spec = await buildMatchday(input.gameId)
        } else if (input.type === 'award_race') {
          if (!input.award || !input.candidates) return 'Error: award_race needs award and candidates.'
          spec = await buildAwardRace({ award: input.award, candidates: input.candidates })
        } else if (input.type === 'power_rankings') {
          if (!input.week || !input.ranking) return 'Error: power_rankings needs week and ranking.'
          spec = await buildPowerRankings({ week: input.week, ranking: input.ranking })
        } else {
          if (!input.week || !input.picks || !input.playerOfTheWeek) {
            return 'Error: totw needs week, picks and playerOfTheWeek.'
          }
          spec = await buildTotw({
            week: input.week,
            picks: input.picks,
            playerOfTheWeek: input.playerOfTheWeek,
          })
        }
        const style = input.style && STYLE_IDS.includes(input.style) ? input.style : DEFAULT_STYLE_ID
        onAttach(spec, style)
        return `Attached the ${GRAPHIC_LABELS[spec.type]} graphic in the ${style} style. It shows: ${JSON.stringify(spec)}`
      } catch (error) {
        if (error instanceof GraphicInputError) return `Error: ${error.message}`
        throw error
      }
    },
  })
}

/**
 * The tool for the weekly stories: the agent hands over its storylines and
 * each is checked and built (lengths, clubs, the game's real scoreline). It
 * saves nothing itself -- the stories wait in the closure for the route.
 */
function submitStoriesTool(week: number, onSubmit: (stories: StoryGraphic[]) => void) {
  return betaTool({
    name: 'submit_stories',
    description: `Submit the weekend's storylines, best first (${STORY_COUNT_MIN} to ${STORY_COUNT_MAX}). Each becomes a template slide. Calling it again replaces the earlier list.`,
    inputSchema: {
      type: 'object',
      properties: {
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: `The slide's title, at most ${STORY_LIMITS.label} characters.` },
              headline: { type: 'string', description: `At most ${STORY_LIMITS.headline} characters.` },
              body: { type: 'string', description: `At most ${STORY_LIMITS.body} characters.` },
              mediaHint: { type: 'string', description: `What to add in the media panel, at most ${STORY_LIMITS.mediaHint} characters.` },
              club: { type: 'string', description: 'Slug or name of the club the story is about.' },
              gameId: { type: 'string', description: 'A completed game from get_games; its scoreline is added.' },
              stats: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { label: { type: 'string' }, value: { type: 'string' } },
                  required: ['label', 'value'],
                  additionalProperties: false,
                },
              },
            },
            required: ['label', 'headline', 'body'],
            additionalProperties: false,
          },
        },
      },
      required: ['stories'],
      additionalProperties: false,
    },
    run: async (input) => {
      try {
        const built = await Promise.all(input.stories.map((story) => buildStory(story, week)))
        const numbered = numberStories(built)
        onSubmit(numbered)
        return `Saved ${numbered.length} stories.`
      } catch (error) {
        if (error instanceof GraphicInputError) return `Error: ${error.message}`
        throw error
      }
    },
  })
}

export class ContentAgentError extends Error {}

export interface WrittenDraft {
  /** A note for the media team when something needs their attention; empty otherwise. */
  text: string
  /** The graphic the agent made. */
  graphic: GraphicSpec
  /** The style the graphic is drawn in; the default style when there is no graphic. */
  style: string
}

/**
 * Makes one graphic for `brief`. Throws a ContentAgentError with a message fit to show the media
 * team when the model declines or produces nothing, and lets SDK errors (rate
 * limits, a bad key) through for the route to classify.
 */
export async function writeDraft(brief: string, kind: string): Promise<WrittenDraft> {
  const client = new Anthropic()
  let graphic: GraphicSpec | null = null
  let style = DEFAULT_STYLE_ID
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
      attachGraphicTool((spec, chosenStyle) => {
        graphic = spec
        style = chosenStyle
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

  if (message.stop_reason === 'max_tokens') {
    throw new ContentAgentError('The graphic ran too long and was cut off. Try again.')
  }
  // The graphic is assigned inside the tool's callback, which the compiler cannot follow.
  const attached = graphic as GraphicSpec | null
  if (!attached) {
    // No graphic means the agent explained why (usually that the data isn't there yet).
    throw new ContentAgentError(text || 'The agent could not make this graphic. Try again.')
  }
  // "Done." is the expected reply; anything else is a note for the media team.
  return { text: text === 'Done.' ? '' : text, graphic: attached, style }
}

/**
 * Chooses the best storylines of one matchweek and returns them as numbered
 * story slides. Throws a ContentAgentError, with a message fit to show the
 * media team, when the agent declines or finds no stories.
 */
export async function writeWeekStories(week: number): Promise<{ stories: StoryGraphic[]; note: string }> {
  const client = new Anthropic()
  let submitted: StoryGraphic[] | null = null
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
    output_config: { effort: 'medium' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    cache_control: { type: 'ephemeral' },
    system: SYSTEM_PROMPT,
    tools: [
      ...tools,
      submitStoriesTool(week, (stories) => {
        submitted = stories
      }),
    ],
    // More reading than a single graphic: every game of the week, then the best box scores.
    max_iterations: 30,
    messages: [
      {
        role: 'user',
        content: `Today is ${today}. Choose the best storylines of matchweek ${week} for "This Week in CSPL" and submit them with submit_stories.`,
      },
    ],
  })

  if (message.stop_reason === 'refusal') {
    throw new ContentAgentError('The agent declined this request. Try again.')
  }
  const text = message.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()
  if (message.stop_reason === 'max_tokens') {
    throw new ContentAgentError('The stories ran too long and were cut off. Try again.')
  }
  // Assigned inside the tool's callback, which the compiler cannot follow.
  const stories = submitted as StoryGraphic[] | null
  if (!stories) {
    throw new ContentAgentError(text || 'The agent could not find stories to tell. Try again.')
  }
  return { stories, note: text === 'Done.' ? '' : text }
}
