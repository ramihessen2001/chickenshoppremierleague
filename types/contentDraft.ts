/**
 * Content desk draft types.
 */

import { GraphicSpec, Ground } from '@/lib/graphics/spec'

export type ContentDraftStatus = 'draft' | 'approved' | 'discarded'

export interface ContentDraft {
  id: string
  /** The preset it started from, or 'custom'. See lib/contentPresets.ts. */
  kind: string
  brief: string
  /** The caption / text. */
  body: string
  status: ContentDraftStatus
  /** The attached picture, as data; null for a caption-only draft. */
  graphic: GraphicSpec | null
  /** Background the picture is drawn on. */
  ground: Ground
  createdAt: string
  updatedAt: string
}

/** The row as Supabase returns it. */
export interface ContentDraftRow {
  id: string
  kind: string
  brief: string
  body: string
  status: ContentDraftStatus
  graphic: GraphicSpec | null
  ground: Ground | null
  created_at: string
  updated_at: string
}

export function toContentDraft(row: ContentDraftRow): ContentDraft {
  return {
    id: row.id,
    kind: row.kind,
    brief: row.brief,
    body: row.body,
    status: row.status,
    graphic: row.graphic ?? null,
    ground: row.ground ?? 'black',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
