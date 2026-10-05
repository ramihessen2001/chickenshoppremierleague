/**
 * Content desk draft types.
 */

export type ContentDraftStatus = 'draft' | 'approved' | 'discarded'

export interface ContentDraft {
  id: string
  /** The preset it started from, or 'custom'. See lib/contentPresets.ts. */
  kind: string
  brief: string
  body: string
  status: ContentDraftStatus
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
