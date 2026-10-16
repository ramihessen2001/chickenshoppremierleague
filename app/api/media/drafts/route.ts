/**
 * Content desk drafts. Media team (or admin) only.
 *
 *   GET  -> { drafts }               newest first, discarded ones left out
 *   POST -> { kind, details?, choice? } -> { drafts }
 *           makes one of the six graphics and saves it as a new draft. `kind`
 *           is one of CONTENT_PRESETS; `details` is an optional line (which
 *           week; `choice` picks the award for an Award Race). Matchday Stories makes one draft per game of the matchweek,
 *           straight from the schedule; the other five run the content agent.
 *           Nothing is published: the media team reviews it next.
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireMedia } from '@/lib/apiAuth'
import { buildMatchdayWeek, GraphicInputError } from '@/lib/graphics/build'
import { DEFAULT_STYLE_ID } from '@/lib/graphics/styles'
import { ContentAgentError, writeDraft } from '@/lib/contentAgent'
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

  const body = await readJson<{ kind?: string; details?: string; choice?: string }>(request)
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

