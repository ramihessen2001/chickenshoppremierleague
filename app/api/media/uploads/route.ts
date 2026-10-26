/**
 * A photo for a story slide. Media team (or admin) only.
 *
 *   POST (multipart/form-data) file -> { url }
 *
 * The desk shrinks every picture in the browser first (a frame is taken from a
 * video), so what arrives is a modest JPEG. It goes in the public images
 * bucket, and the slide renderer draws it from that URL.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireMedia } from '@/lib/apiAuth'

const MAX_BYTES = 4 * 1024 * 1024 // 4 MB: the desk sends well under 1 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'league-images'

export async function POST(request: Request) {
  const denied = await requireMedia()
  if (denied) return denied

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return fail('Expected multipart/form-data')
  }

  const file = formData.get('file')
  if (!(file instanceof File)) return fail('No picture provided')
  if (file.size === 0) return fail('The picture is empty')
  if (file.size > MAX_BYTES) return fail('The picture must be 4MB or smaller')
  if (!ALLOWED_TYPES.includes(file.type)) return fail('The picture must be a JPEG, PNG or WebP')

  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const objectName = `content/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extension}`

  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(objectName, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  })
  if (error) {
    console.error('Content desk picture upload failed:', error)
    return fail(`Upload failed: ${error.message}`, 500)
  }

  return NextResponse.json({ url: supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectName).data.publicUrl })
}
