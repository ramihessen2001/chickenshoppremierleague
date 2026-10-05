/**
 * Edit or review one content desk draft. Media team (or admin) only.
 *
 *   PATCH -> { body?, status?, ground? } -> { draft }
 *     body    the edited text
 *     status  'draft' | 'approved' | 'discarded'
 *     ground  'black' | 'bone', the graphic's background
 *
 * Approving only marks a draft ready to copy out -- nothing here publishes.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireMedia } from '@/lib/apiAuth'
import { ContentDraftRow, ContentDraftStatus, toContentDraft } from '@/types/contentDraft'
import { Ground, GROUNDS } from '@/lib/graphics/spec'

const STATUSES: ContentDraftStatus[] = ['draft', 'approved', 'discarded']

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireMedia()
  if (denied) return denied

  const { id } = await params
  const body = await readJson<{ body?: string; status?: string; ground?: string }>(request)
  if (!body) return fail('Invalid request body')

  const columns: Record<string, unknown> = {}
  if (body.body !== undefined) {
    if (typeof body.body !== 'string' || !body.body.trim()) {
      return fail('A draft cannot be empty')
    }
    columns.body = body.body
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status as ContentDraftStatus)) {
      return fail(`status must be one of: ${STATUSES.join(', ')}`)
    }
    columns.status = body.status
  }
  if (body.ground !== undefined) {
    if (!GROUNDS.includes(body.ground as Ground)) {
      return fail(`ground must be one of: ${GROUNDS.join(', ')}`)
    }
    columns.ground = body.ground
  }
  if (Object.keys(columns).length === 0) return fail('No fields to update')

  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .update(columns)
    .eq('id', id)
    .select()
    .maybeSingle()

  if (error) {
    console.error(`Error updating content draft ${id}:`, error)
    return fail('Failed to update the draft', 500)
  }
  if (!data) return fail('Draft not found', 404)
  return NextResponse.json({ draft: toContentDraft(data as ContentDraftRow) })
}
