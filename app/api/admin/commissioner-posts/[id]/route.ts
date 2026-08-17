/**
 * Update or delete a commissioner's board post. Admin only.
 *
 *   PATCH (multipart/form-data) -> { success }
 *     body       required, the message text
 *     mediaType  "none" | "youtube" | "image"
 *     mediaUrl   a YouTube watch/live URL, required when mediaType is "youtube"
 *     file       an image; when mediaType is "image" and no file is sent, the
 *                post's existing image is kept rather than requiring a
 *                re-upload every time the text changes
 *   DELETE -> { success }
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireAdmin } from '@/lib/apiAuth'
import { youTubeVideoId } from '@/lib/youtube'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const BUCKET = 'league-images'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return fail('Expected multipart/form-data')
  }

  const body = formData.get('body')
  const mediaType = formData.get('mediaType')

  if (typeof body !== 'string' || !body.trim()) return fail('body is required')
  if (mediaType !== 'none' && mediaType !== 'youtube' && mediaType !== 'image') {
    return fail('mediaType must be one of: none, youtube, image')
  }

  let mediaUrl: string | null = null

  if (mediaType === 'youtube') {
    const url = formData.get('mediaUrl')
    if (typeof url !== 'string' || !youTubeVideoId(url)) {
      return fail(
        'That does not look like a YouTube video link. Use the watch, live or youtu.be URL for the video itself, not a channel.'
      )
    }
    mediaUrl = url.trim()
  }

  if (mediaType === 'image') {
    const file = formData.get('file')

    if (file instanceof File && file.size > 0) {
      if (file.size > MAX_BYTES) return fail('Image must be 5MB or smaller')
      if (!ALLOWED_TYPES.includes(file.type)) {
        return fail('Image must be a PNG, JPEG, WebP or GIF')
      }

      const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
      const objectName = `commissioner/${Date.now()}.${extension}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(objectName, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('Commissioner post image upload failed:', uploadError)
        return fail(`Upload failed: ${uploadError.message}`, 500)
      }

      mediaUrl = supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectName).data.publicUrl
    } else {
      // No new file -- keep whatever image the post already has.
      const { data: existing, error: readError } = await supabaseAdmin
        .from('commissioner_posts')
        .select('media_url')
        .eq('id', id)
        .maybeSingle()

      if (readError) {
        console.error('Error reading existing post:', readError)
        return fail('Failed to read the existing post', 500)
      }
      if (!existing?.media_url) return fail('An image is required for this post')
      mediaUrl = existing.media_url
    }
  }

  const { error } = await supabaseAdmin
    .from('commissioner_posts')
    .update({ body: body.trim(), media_type: mediaType, media_url: mediaUrl })
    .eq('id', id)

  if (error) {
    console.error('Error updating commissioner post:', error)
    return fail('Failed to update the post', 500)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requireAdmin()
  if (denied) return denied

  const { id } = await params
  const { error } = await supabaseAdmin.from('commissioner_posts').delete().eq('id', id)

  if (error) {
    console.error('Error deleting commissioner post:', error)
    return fail('Failed to delete the post', 500)
  }

  return NextResponse.json({ success: true })
}
