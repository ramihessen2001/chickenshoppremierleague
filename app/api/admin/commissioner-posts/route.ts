/**
 * Create a commissioner's board post. Admin only.
 *
 *   POST (multipart/form-data) -> { id }
 *     body       required, the message text
 *     mediaType  "none" | "youtube" | "image"
 *     mediaUrl   a YouTube watch/live URL, required when mediaType is "youtube"
 *     file       an image, required when mediaType is "image"
 *
 * Always multipart, even for a text-only or YouTube post, so the same form on
 * the client works whether or not a file is attached.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireAdmin } from '@/lib/apiAuth'
import { youTubeVideoId } from '@/lib/youtube'

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const BUCKET = 'league-images'

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

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
    if (!(file instanceof File)) return fail('No image file provided')
    if (file.size === 0) return fail('File is empty')
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
  }

  const { data, error } = await supabaseAdmin
    .from('commissioner_posts')
    .insert({ body: body.trim(), media_type: mediaType, media_url: mediaUrl })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating commissioner post:', error)
    return fail('Failed to create the post', 500)
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
