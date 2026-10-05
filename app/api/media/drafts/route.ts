/**
 * Content desk drafts. Media team (or admin) only.
 *
 *   GET  -> { drafts }               newest first, discarded ones left out
 *   POST -> { kind, brief } -> { draft }
 *           runs the content agent on the brief and saves what it writes --
 *           the caption, plus a graphic when the brief calls for one -- as a
 *           new draft. Nothing is published: the media team reviews it next.
 */

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireMedia } from '@/lib/apiAuth'
import { ContentAgentError, writeDraft } from '@/lib/contentAgent'
import { CONTENT_PRESETS, CUSTOM_KIND } from '@/lib/contentPresets'
import { ContentDraftRow, toContentDraft } from '@/types/contentDraft'

// The agent makes several data lookups before it writes, which can take a
// minute or more -- well past the default function timeout.
export const maxDuration = 300

const MAX_BRIEF_LENGTH = 4000
const KNOWN_KINDS = new Set([CUSTOM_KIND, ...CONTENT_PRESETS.map((p) => p.kind)])

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

  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(
      'The content agent is not set up yet: ANTHROPIC_API_KEY is missing from the environment.',
      503
    )
  }

  const body = await readJson<{ kind?: string; brief?: string }>(request)
  const brief = body?.brief?.trim()
  if (!brief) return fail('Write a brief first')
  if (brief.length > MAX_BRIEF_LENGTH) {
    return fail(`Keep the brief under ${MAX_BRIEF_LENGTH} characters`)
  }
  const kind = body?.kind && KNOWN_KINDS.has(body.kind) ? body.kind : CUSTOM_KIND

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
    .insert({ kind, brief, body: written.text, graphic: written.graphic })
    .select()
    .single()

  if (error) {
    console.error('Error saving content draft:', error)
    return fail('The draft was written but could not be saved -- have migrations 027 and 028 been run?', 500)
  }
  return NextResponse.json({ draft: toContentDraft(data as ContentDraftRow) })
}
