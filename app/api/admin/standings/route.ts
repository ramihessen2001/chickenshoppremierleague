/**
 * Upload the standings image. Admin only.
 *
 *   POST (multipart/form-data, field "file") -> { url }
 *
 * The upload runs server-side with the service role key, so the storage bucket
 * can stay read-only to the public. Previously the browser uploaded directly,
 * which required a bucket that accepted writes from anyone.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, requireAdmin } from '@/lib/apiAuth'

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

  const file = formData.get('file')
  if (!(file instanceof File)) return fail('No file provided')
  if (file.size === 0) return fail('File is empty')
  if (file.size > MAX_BYTES) return fail('File must be 5MB or smaller')
  if (!ALLOWED_TYPES.includes(file.type)) {
    return fail('File must be a PNG, JPEG, WebP or GIF image')
  }

  const extension = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const objectName = `standings/${Date.now()}.${extension}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(objectName, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('Standings upload failed:', uploadError)
    return fail(`Upload failed: ${uploadError.message}`, 500)
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(objectName)

  const { data: existing } = await supabaseAdmin
    .from('league_config')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (!existing) return fail('League config not found', 404)

  const { error: updateError } = await supabaseAdmin
    .from('league_config')
    .update({ standings_image_url: publicUrl })
    .eq('id', existing.id)

  if (updateError) {
    console.error('Failed to record standings URL:', updateError)
    return fail('Image uploaded but could not be saved to the league config', 500)
  }

  return NextResponse.json({ url: publicUrl })
}
