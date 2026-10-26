/**
 * The picture picker for "Story from Media" on the content desk.
 *
 * The media team drops in photos or videos and writes one line for each saying
 * what it shows. A photo goes into the slide. A video cannot (a slide is a
 * still), so one frame is taken from it for the agent to look at, and the
 * slide keeps an empty window for the team to lay the video over. Each picture
 * is shrunk in the browser and uploaded as soon as it is chosen, so by the
 * time the team presses the button the agent only needs its address and the note.
 */

'use client'

import { ChangeEvent, useRef } from 'react'
import { buttonSecondary, fieldClass, labelClass } from './Modal'

export interface MediaItem {
  id: string
  /** A local preview of the picture, for the thumbnail. */
  previewUrl: string
  /** Where the uploaded picture lives; null until the upload has finished. */
  url: string | null
  note: string
  uploading: boolean
  error: string | null
  fromVideo: boolean
}

export const MAX_MEDIA_ITEMS = 4
/** The longest side a slide ever draws a picture at is under 1000px; this leaves room to crop. */
const MAX_SIDE = 1600

/** A JPEG of the picture, no more than MAX_SIDE on its longest side. */
async function shrink(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('This browser cannot prepare pictures.')
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not prepare the picture.'))), 'image/jpeg', 0.85)
  )
}

/** One frame from a video, a second in (or halfway, for a short clip). */
function frameFromVideo(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    const done = () => URL.revokeObjectURL(url)
    video.onerror = () => {
      done()
      reject(new Error('Could not read that video. Try a different file.'))
    }
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, (video.duration || 2) / 2)
    }
    video.onseeked = () => {
      shrink(video, video.videoWidth, video.videoHeight).then(
        (blob) => {
          done()
          resolve(blob)
        },
        (error) => {
          done()
          reject(error)
        }
      )
    }
    video.src = url
  })
}

async function prepare(file: File): Promise<{ blob: Blob; fromVideo: boolean }> {
  if (file.type.startsWith('video/')) return { blob: await frameFromVideo(file), fromVideo: true }
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo or a video.')
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const blob = await shrink(bitmap, bitmap.width, bitmap.height)
    bitmap.close()
    return { blob, fromVideo: false }
  } catch {
    throw new Error('Could not read that picture. Try a JPEG or PNG.')
  }
}

export function MediaStoryUploader({
  items,
  onChange,
  disabled,
}: {
  items: MediaItem[]
  onChange: (update: (current: MediaItem[]) => MediaItem[]) => void
  disabled: boolean
}) {
  const input = useRef<HTMLInputElement>(null)

  const patch = (id: string, fields: Partial<MediaItem>) =>
    onChange((current) => current.map((item) => (item.id === id ? { ...item, ...fields } : item)))

  const add = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(0, MAX_MEDIA_ITEMS - items.length))
    event.target.value = ''
    for (const file of files) {
      const id = crypto.randomUUID()
      onChange((current) => [
        ...current,
        { id, previewUrl: '', url: null, note: '', uploading: true, error: null, fromVideo: false },
      ])
      try {
        const { blob, fromVideo } = await prepare(file)
        patch(id, { previewUrl: URL.createObjectURL(blob), fromVideo })
        const form = new FormData()
        form.append('file', new File([blob], 'story.jpg', { type: 'image/jpeg' }))
        const response = await fetch('/api/media/uploads', { method: 'POST', body: form })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body?.error || 'The upload failed. Try again.')
        patch(id, { url: body.url, uploading: false })
      } catch (error) {
        patch(id, { uploading: false, error: error instanceof Error ? error.message : 'The upload failed.' })
      }
    }
  }

  const remove = (id: string) => onChange((current) => current.filter((item) => item.id !== id))
  const full = items.length >= MAX_MEDIA_ITEMS

  return (
    <div className="mt-6">
      <p className={labelClass}>Photos or videos</p>
      <input
        ref={input}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={add}
        disabled={disabled || full}
        className="sr-only"
        aria-label="Choose photos or videos"
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={disabled || full}
        className={`w-full ${buttonSecondary}`}
      >
        {full ? `${MAX_MEDIA_ITEMS} is the most at once` : items.length > 0 ? 'Add another' : 'Choose photos or videos'}
      </button>
      <p className="mt-2 text-[13px] text-ink-tertiary">
        One story per picture. A photo goes into the slide. A video doesn&apos;t: the slide keeps an empty window
        for you to place the video over when you post, and a frame from the video is only used to help the agent.
      </p>

      {items.length > 0 && (
        <ul className="mt-4 flex flex-col gap-4">
          {items.map((item, index) => (
            <li key={item.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
              <div className="relative aspect-[4/3] w-full border border-hairline bg-surface-hover">
                {item.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
                  <img src={item.previewUrl} alt={`Picture ${index + 1}`} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0">
                <label htmlFor={`media-note-${item.id}`} className="text-[12px] font-medium text-ink-secondary">
                  What is it?
                </label>
                <input
                  id={`media-note-${item.id}`}
                  type="text"
                  maxLength={300}
                  value={item.note}
                  onChange={(e) => patch(item.id, { note: e.target.value })}
                  disabled={disabled}
                  placeholder="e.g. Rizgar's fourth goal against Kabul"
                  className={fieldClass}
                />
                <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
                  <span className={item.error ? 'text-negative' : 'text-ink-tertiary'} role={item.error ? 'alert' : undefined}>
                    {item.error ?? (item.uploading ? 'Uploading…' : item.fromVideo ? 'Video · window left empty for you' : 'Ready')}
                  </span>
                  <button type="button" onClick={() => remove(item.id)} disabled={disabled} className="underline">
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
