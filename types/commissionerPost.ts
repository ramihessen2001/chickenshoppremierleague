/**
 * Commissioner's board post types.
 */

export type CommissionerPostMediaType = 'none' | 'youtube' | 'image'

export interface CommissionerPost {
  id: string
  body: string
  mediaType: CommissionerPostMediaType
  /** YouTube watch/live URL, or an uploaded image URL. Null when mediaType is "none". */
  mediaUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CommissionerPostWriteFields {
  body: string
  mediaType: CommissionerPostMediaType
  /** A YouTube URL when mediaType is "youtube". Ignored otherwise. */
  mediaUrl?: string | null
  /** An image file when mediaType is "image". Ignored otherwise. */
  imageFile?: File | null
}
