/**
 * A draft's graphic as a 1080x1440 PNG. Media team (or admin) only.
 *
 *   GET [?download=1] -> PNG, drawn from the draft's stored snapshot on its
 *                        chosen background. With download=1 the browser saves
 *                        it as a file instead of showing it.
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireMedia } from '@/lib/apiAuth'
import { renderGraphic } from '@/lib/graphics/render'
import { ContentDraftRow, toContentDraft } from '@/types/contentDraft'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: Params) {
  const denied = await requireMedia()
  if (denied) return denied

  const { id } = await params
  const { data, error } = await supabaseAdmin
    .from('content_drafts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching content draft ${id}:`, error)
    return fail('Failed to load the draft', 500)
  }
  if (!data) return fail('Draft not found', 404)

  const draft = toContentDraft(data as ContentDraftRow)
  if (!draft.graphic) return fail('This draft has no graphic', 404)

  const headers: Record<string, string> = { 'Cache-Control': 'private, no-store' }
  if (new URL(request.url).searchParams.get('download')) {
    const date = draft.createdAt.slice(0, 10)
    headers['Content-Disposition'] =
      `attachment; filename="cspl-${draft.graphic.type.replace('_', '-')}-${draft.ground}-${date}.png"`
  }
  return renderGraphic(draft.graphic, draft.ground, headers)
}
