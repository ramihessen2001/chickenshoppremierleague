/**
 * Content desk drafts. Media team (or admin) only.
 *
 *   GET  -> { drafts }               newest first, discarded ones left out
 *   POST -> { kind, details?, choice?, items? } -> { drafts }
 *           makes one of the graphics and saves it as a new draft. `kind`
 *           is one of CONTENT_PRESETS; `details` is an optional line (which
 *           week; `choice` picks the award for an Award Race). Matchday Stories makes one draft per game of the matchweek,
 *           and Matchday Thumbnails one per day of it, both straight from the
 *           schedule; the others run the content agent.
 *           Nothing is published: the media team reviews it next.
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireMedia } from '@/lib/apiAuth'
import {
  buildMatchdayWeek,
  latestResultsWeek,
  buildResults,
  buildSlate,
  buildTable,
  buildThumbnailWeek,
  buildWeekCover,
  GraphicInputError,
  numberStories,
} from '@/lib/graphics/build'
import { STORY_COUNT_MAX, type GraphicSpec } from '@/lib/graphics/spec'
import { DEFAULT_STYLE_ID } from '@/lib/graphics/styles'
import { ContentAgentError, writeDictatedStory, writeDraft } from '@/lib/contentAgent'
import { buildBrief } from '@/lib/contentPresets'
import { ContentDraftRow, toContentDraft } from '@/types/contentDraft'

// The agent makes several data lookups before it writes, which can take a
// minute or more -- well past the default function timeout.
export const maxDuration = 300

const MAX_DETAILS_LENGTH = 300

export async function GET() {
  const denied = await requireMedia()
  if (denied) return denied

  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .select('*')
    .neq('status', 'discarded')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('Error fetching content drafts:', error)
    return fail('Failed to load drafts -- has migration 027 been run?', 500)
  }
  return NextResponse.json({ drafts: (data as ContentDraftRow[]).map(toContentDraft) })
}

export async function POST(request: Request) {
  const denied = await requireMedia()
  if (denied) return denied

  const body = await readJson<{
    kind?: string
    details?: string
    choice?: string
    items?: { mediaUrl?: string; note?: string; isVideo?: boolean }[]
  }>(request)
  const details = typeof body?.details === 'string' ? body.details.trim() : ''
  if (details.length > MAX_DETAILS_LENGTH) {
    return fail(`Keep the details under ${MAX_DETAILS_LENGTH} characters`)
  }
  const kind = body?.kind ?? ''
  const brief = buildBrief(kind, details, body?.choice ?? '')
  if (!brief) return fail(kind === 'award_race' ? 'Choose which award' : 'Choose which graphic to make')

  // Matchday stories are all schedule data, no judgment: one per game of the
  // matchweek, with no agent involved.
  if (kind === 'matchday') return makeMatchdayStories(details)
  if (kind === 'thumbnail') return makeThumbnails(details)
  if (kind === 'week_in_cspl') return makeWeekInCspl(details, body?.items ?? [])
  if (kind === 'story_media') return makeStoriesFromMedia(body?.items ?? [])

  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(
      'The content agent is not set up yet: ANTHROPIC_API_KEY is missing from the environment.',
      503
    )
  }

  let written: Awaited<ReturnType<typeof writeDraft>>
  try {
    written = await writeDraft(brief, kind)
  } catch (error) {
    const response = agentFailure(error)
    if (response) return response
    throw error
  }

  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .insert({ kind, brief, body: written.text, graphic: written.graphic, style: written.style })
    .select()
    .single()

  if (error) {
    console.error('Error saving content draft:', error)
    return fail('The draft was written but could not be saved -- have migrations 027-029 been run?', 500)
  }
  return NextResponse.json({ drafts: [toContentDraft(data as ContentDraftRow)] })
}

/** One draft per game of the matchweek named in `details` (a number), else the current one. */
async function makeMatchdayStories(details: string) {
  const named = details.match(/\d+/)
  let built: Awaited<ReturnType<typeof buildMatchdayWeek>>
  try {
    built = await buildMatchdayWeek(named ? Number(named[0]) : undefined)
  } catch (error) {
    if (error instanceof GraphicInputError) return fail(error.message, 422)
    throw error
  }
  if (built.stories.length === 0) {
    return fail(`Matchweek ${built.week} has games, but none has both clubs set yet.`, 422)
  }

  const brief = `Matchday stories for matchweek ${built.week}: ${built.stories.length} ${
    built.stories.length === 1 ? 'game' : 'games'
  }.`
  // The queue lists newest first and rows inserted together share a timestamp,
  // so each game gets its own, a second apart, the first game newest: the
  // stories read in play order, top to bottom.
  const now = Date.now()
  const note = built.skipped > 0 ? `${built.skipped} game(s) left out: their clubs are not set yet.` : ''
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .insert(
      built.stories.map((graphic, i) => ({
        kind: 'matchday',
        brief,
        body: i === 0 ? note : '',
        graphic,
        style: DEFAULT_STYLE_ID,
        created_at: new Date(now - i * 1000).toISOString(),
      }))
    )
    .select()
  if (error) {
    console.error('Error saving matchday story drafts:', error)
    return fail('The stories were made but could not be saved -- have migrations 027-029 been run?', 500)
  }
  const drafts = (data as ContentDraftRow[])
    .map(toContentDraft)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ drafts })
}

/**
 * One YouTube thumbnail draft per matchday of the matchweek named in `details`
 * (a number), else the current one. Schedule data only, like the stories.
 */
async function makeThumbnails(details: string) {
  const named = details.match(/\d+/)
  let built: Awaited<ReturnType<typeof buildThumbnailWeek>>
  try {
    built = await buildThumbnailWeek(named ? Number(named[0]) : undefined)
  } catch (error) {
    if (error instanceof GraphicInputError) return fail(error.message, 422)
    throw error
  }
  if (built.thumbnails.length === 0) {
    return fail(`Matchweek ${built.week} has games, but none has both clubs set yet.`, 422)
  }

  const days = built.thumbnails.length
  const brief = `Matchday thumbnails for matchweek ${built.week}: ${days} ${days === 1 ? 'day' : 'days'}.`
  // Newest first in the queue, so each day gets its own timestamp a second
  // apart, the first day newest: the thumbnails read in date order.
  const now = Date.now()
  const note = built.skipped > 0 ? `${built.skipped} game(s) left out: their clubs are not set yet.` : ''
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .insert(
      built.thumbnails.map((graphic, i) => ({
        kind: 'thumbnail',
        brief,
        body: i === 0 ? note : '',
        graphic,
        style: DEFAULT_STYLE_ID,
        created_at: new Date(now - i * 1000).toISOString(),
      }))
    )
    .select()
  if (error) {
    console.error('Error saving thumbnail drafts:', error)
    return fail('The thumbnails were made but could not be saved -- have migrations 027-029 been run?', 500)
  }
  const drafts = (data as ContentDraftRow[])
    .map(toContentDraft)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ drafts })
}

/** The response for a failed agent run, or null when the error is not one we explain. */
function agentFailure(error: unknown) {
  if (error instanceof ContentAgentError) return fail(error.message, 422)
  if (error instanceof Anthropic.AuthenticationError) {
    console.error('Content agent: invalid Anthropic API key')
    return fail('The content agent is misconfigured: the Anthropic API key was rejected.', 503)
  }
  if (error instanceof Anthropic.RateLimitError) {
    return fail('The content agent is busy. Try again in a minute.', 429)
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Content agent API error ${error.status}:`, error.message)
    return fail('The content agent could not finish this draft. Try again.', 502)
  }
  return null
}

type StoryItem = { mediaUrl?: string; note?: string; isVideo?: boolean }

const MAX_NOTE_LENGTH = 600

/**
 * The media team's stories, checked: each needs a description, a picture (when
 * `requireMedia`) must be one the desk uploaded to our own storage, so the
 * agent and the renderer are never pointed at a stranger's URL. Returns the
 * cleaned list, or the response to send back.
 */
function cleanStoryItems(items: StoryItem[], max: number, requireMedia: boolean) {
  if (items.length === 0) return fail(requireMedia ? 'Choose a photo or video first' : 'Describe at least one story')
  if (items.length > max) return fail(`Send ${max} stories or fewer at a time`)
  const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/league-images/content/`
  const clean: { note: string; media: { url: string; isVideo: boolean } | null }[] = []
  for (const item of items) {
    const note = (item.note ?? '').trim()
    if (note.length < 3) return fail(requireMedia ? 'Say what each picture shows' : 'Describe each story')
    if (note.length > MAX_NOTE_LENGTH) return fail(`Keep each description under ${MAX_NOTE_LENGTH} characters`)
    const url = item.mediaUrl ?? ''
    if (!url && requireMedia) return fail('Choose a photo or video first')
    if (url && !url.startsWith(allowedPrefix)) return fail('A picture was not uploaded through the desk')
    clean.push({ note, media: url ? { url, isVideo: item.isVideo === true } : null })
  }
  return clean
}

/**
 * "This Week in CSPL": the cover, the weekend's results, the table, one slide
 * for each story the media team describes, and last the following week's slate.
 * The stories are the team's: the agent never chooses or changes one. For each
 * it writes the title and headline, and uses the league's data only to give the
 * story context. Results,
 * table and slate come straight from the database. Nothing is saved unless the
 * whole carousel was made, so it is never half a post.
 */
async function makeWeekInCspl(details: string, items: StoryItem[]) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(
      'The content agent is not set up yet: ANTHROPIC_API_KEY is missing from the environment.',
      503
    )
  }
  const cleaned = cleanStoryItems(items, STORY_COUNT_MAX, false)
  if (cleaned instanceof NextResponse) return cleaned
  const named = details.match(/\d+/)

  let results
  let table
  try {
    ;[results, table] = await Promise.all([
      buildResults(named ? Number(named[0]) : undefined),
      buildTable(),
    ])
  } catch (error) {
    if (error instanceof GraphicInputError) return fail(error.message, 422)
    throw error
  }

  const week = results.week
  let written: Awaited<ReturnType<typeof writeDictatedStory>>[]
  try {
    written = await Promise.all(cleaned.map((item) => writeDictatedStory(item.note, week, item.media)))
  } catch (error) {
    const response = agentFailure(error)
    if (response) return response
    throw error
  }
  const stories = numberStories(written.map((w) => w.story), 1)
  const notes = written.map((w, i) => (w.note ? `Story ${i + 1}: ${w.note}` : '')).filter(Boolean).join('\n')

  // The last slide is the following week's slate. Near the end of the season
  // there may be no next week with fixtures; the carousel then simply ends on the stories.
  let slate: GraphicSpec | null = null
  try {
    slate = await buildSlate(week + 1)
  } catch (error) {
    if (!(error instanceof GraphicInputError)) throw error
  }

  const cover = buildWeekCover(week, results.season, stories, slate !== null)
  const slides: GraphicSpec[] = [cover, results, table, ...stories, ...(slate ? [slate] : [])]
  const labels = [
    'This Week in CSPL',
    'Weekend Results',
    'League Table',
    ...stories.map((st) => st.label),
    ...(slate ? ["Next Week's Slate"] : []),
  ]
  // Newest first in the queue: each slide a second apart, the cover newest.
  const now = Date.now()
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .insert(
      slides.map((graphic, i) => ({
        kind: 'week_in_cspl',
        brief: `This Week in CSPL, matchweek ${week}: slide ${i + 1} of ${slides.length}, ${labels[i]}.`,
        body: i === 0 ? notes : '',
        graphic,
        style: DEFAULT_STYLE_ID,
        created_at: new Date(now - i * 1000).toISOString(),
      }))
    )
    .select()
  if (error) {
    console.error('Error saving This Week in CSPL drafts:', error)
    return fail('The slides were made but could not be saved -- have migrations 027-029 been run?', 500)
  }
  const drafts = (data as ContentDraftRow[])
    .map(toContentDraft)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ drafts })
}

const MAX_MEDIA_STORIES = 4

/**
 * One story slide per picture the media team sent, each from the team's own
 * description, with the league's data for context. A photo goes into the
 * slide's panel; a video's slide keeps an empty panel for the team to place the
 * video over.
 */
async function makeStoriesFromMedia(items: StoryItem[]) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(
      'The content agent is not set up yet: ANTHROPIC_API_KEY is missing from the environment.',
      503
    )
  }
  const cleaned = cleanStoryItems(items, MAX_MEDIA_STORIES, true)
  if (cleaned instanceof NextResponse) return cleaned

  let week: number
  try {
    week = await latestResultsWeek()
  } catch (error) {
    if (error instanceof GraphicInputError) return fail(error.message, 422)
    throw error
  }

  let made: Awaited<ReturnType<typeof writeDictatedStory>>[]
  try {
    made = await Promise.all(cleaned.map((item) => writeDictatedStory(item.note, week, item.media)))
  } catch (error) {
    const response = agentFailure(error)
    if (response) return response
    throw error
  }

  // Newest first in the queue: each story a second apart, the first picture newest.
  const now = Date.now()
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .insert(
      made.map((result, i) => ({
        kind: 'story_media',
        brief: `Story from media: ${cleaned[i].note}`,
        body: result.note,
        graphic: result.story,
        style: DEFAULT_STYLE_ID,
        created_at: new Date(now - i * 1000).toISOString(),
      }))
    )
    .select()
  if (error) {
    console.error('Error saving media story drafts:', error)
    return fail('The stories were made but could not be saved -- have migrations 027-029 been run?', 500)
  }
  const drafts = (data as ContentDraftRow[])
    .map(toContentDraft)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return NextResponse.json({ drafts })
}
