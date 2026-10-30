/**
 * The story builder on the content desk.
 *
 * The media team dictates each story, one entry per story, as many as the week
 * needs. Each has its own text box to dictate the story to the agent, which
 * looks up the context and writes the slide. A story can carry a photo or a video. A photo
 * goes into the slide. A video cannot (a slide is a still), so one frame is
 * taken from it for the agent to look at, and the slide keeps an empty window
 * for the team to lay the video over. Pictures are shrunk in the browser and
 * uploaded as soon as they are chosen, so by the time the team presses the
 * button the server only needs each picture's address and the description.
 *
 * The agent never chooses or changes a story: it uses the league's data only
 * to give what is written here its context.
 */

'use client'

import { ChangeEvent, useRef } from 'react'
import { buttonSecondary, fieldClass, labelClass } from './Modal'

export interface StoryMedia {
  /** A local preview of the picture, for the thumbnail. */
  previewUrl: string
  /** Where the uploaded picture lives; null until the upload has finished. */
  url: string | null
  uploading: boolean
  error: string | null
  fromVideo: boolean
}

export interface StoryEntry {
  id: string
  /** The story, dictated to the agent: it finds the context and writes the slide. */
  note: string
  media: StoryMedia | null
}

export const MAX_STORIES = 6
export const newStoryEntry = (): StoryEntry => ({ id: crypto.randomUUID(), note: '', media: null })

/** The longest side a slide ever draws a picture at is under 1000px; this leaves room to crop. */
const MAX_SIDE = 1600

/** A JPEG of the picture, no more than `maxSide` on its longest side. */
async function shrink(source: CanvasImageSource, width: number, height: number, maxSide = MAX_SIDE): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(width, height))
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

/**
 * A photo as an upright JPEG, no more than `maxSide` on its longest side. The
 * camera's orientation is applied here, so a phone photo never arrives sideways.
 */
export async function preparePhoto(file: File, maxSide = MAX_SIDE): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo.')
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const blob = await shrink(bitmap, bitmap.width, bitmap.height, maxSide)
    bitmap.close()
    return blob
  } catch {
    throw new Error('Could not read that picture. Try a JPEG or PNG.')
  }
}

/** Sends a prepared picture to the desk's uploads, returning where it now lives. */
export async function uploadPicture(blob: Blob): Promise<string> {
  const form = new FormData()
  form.append('file', new File([blob], 'story.jpg', { type: 'image/jpeg' }))
  const response = await fetch('/api/media/uploads', { method: 'POST', body: form })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || 'The upload failed. Try again.')
  return body.url
}

async function prepare(file: File): Promise<{ blob: Blob; fromVideo: boolean }> {
  if (file.type.startsWith('video/')) return { blob: await frameFromVideo(file), fromVideo: true }
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo or a video.')
  return { blob: await preparePhoto(file), fromVideo: false }
}

export function StoryBuilder({
  entries,
  onChange,
  disabled,
  requireMedia,
}: {
  entries: StoryEntry[]
  onChange: (update: (current: StoryEntry[]) => StoryEntry[]) => void
  disabled: boolean
  /** Whether every story must come with a photo or video. */
  requireMedia: boolean
}) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({})

  const patch = (id: string, fields: Partial<StoryEntry>) =>
    onChange((current) => current.map((entry) => (entry.id === id ? { ...entry, ...fields } : entry)))
  const patchMedia = (id: string, fields: Partial<StoryMedia>) =>
    onChange((current) =>
      current.map((entry) => (entry.id === id && entry.media ? { ...entry, media: { ...entry.media, ...fields } } : entry))
    )

  const attach = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    patch(id, { media: { previewUrl: '', url: null, uploading: true, error: null, fromVideo: false } })
    try {
      const { blob, fromVideo } = await prepare(file)
      patchMedia(id, { previewUrl: URL.createObjectURL(blob), fromVideo })
      patchMedia(id, { url: await uploadPicture(blob), uploading: false })
    } catch (error) {
      patchMedia(id, { uploading: false, error: error instanceof Error ? error.message : 'The upload failed.' })
    }
  }

  const removeStory = (id: string) => onChange((current) => current.filter((entry) => entry.id !== id))
  const full = entries.length >= MAX_STORIES

  return (
    <div className="mt-6">
      <p className={labelClass}>Stories</p>
      <p className="text-[13px] text-ink-tertiary">
        You choose the stories: add one for each this week needs and dictate it in its own box. The agent uses the
        league&apos;s data for context and writes the slide&apos;s title and text from what you say.
      </p>

      <ol className="mt-4 flex flex-col gap-5">
        {entries.map((entry, index) => (
          <li key={entry.id} className="border border-hairline p-3">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={`story-note-${entry.id}`} className="text-[13px] font-medium text-ink">
                Story {index + 1}
              </label>
              {entries.length > 1 && (
                <button type="button" onClick={() => removeStory(entry.id)} disabled={disabled} className="text-[12px] underline">
                  Remove story
                </button>
              )}
            </div>
            <textarea
              id={`story-note-${entry.id}`}
              rows={4}
              maxLength={600}
              value={entry.note}
              onChange={(e) => patch(entry.id, { note: e.target.value })}
              disabled={disabled}
              placeholder="Tell the agent the story, e.g. Dakar beat Kabul 11-2 on Friday and Rizgar Rashid scored four of them"
              className={`${fieldClass} mt-1 leading-relaxed`}
            />

            <input
              ref={(node) => {
                inputs.current[entry.id] = node
              }}
              type="file"
              accept="image/*,video/*"
              onChange={(e) => attach(entry.id, e)}
              disabled={disabled}
              className="sr-only"
              aria-label={`Photo or video for story ${index + 1}`}
            />
            {entry.media ? (
              <div className="mt-2 grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
                <div className="aspect-[4/3] w-full border border-hairline bg-surface-hover">
                  {entry.media.previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
                    <img src={entry.media.previewUrl} alt={`Story ${index + 1}`} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 text-[12px]">
                  <p className={entry.media.error ? 'text-negative' : 'text-ink-secondary'} role={entry.media.error ? 'alert' : undefined}>
                    {entry.media.error ??
                      (entry.media.uploading
                        ? 'Uploading…'
                        : entry.media.fromVideo
                          ? 'Video · the slide keeps an empty window for it'
                          : 'Photo · goes into the slide')}
                  </p>
                  <button
                    type="button"
                    onClick={() => patch(entry.id, { media: null })}
                    disabled={disabled}
                    className="mt-1 underline"
                  >
                    Remove {entry.media.fromVideo ? 'video' : 'photo'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputs.current[entry.id]?.click()}
                disabled={disabled}
                className={`mt-2 w-full ${buttonSecondary}`}
              >
                {requireMedia ? 'Choose a photo or video' : 'Add a photo or video (optional)'}
              </button>
            )}
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => onChange((current) => [...current, newStoryEntry()])}
        disabled={disabled || full}
        className={`mt-4 w-full ${buttonSecondary}`}
      >
        {full ? `${MAX_STORIES} is the most in a post` : 'Add a story'}
      </button>
      <p className="mt-2 text-[13px] text-ink-tertiary">
        A photo goes into the slide. A video doesn&apos;t: the slide keeps an empty window for you to place the
        video over when you post. A frame from it only helps the agent understand what it is.
      </p>
    </div>
  )
}
