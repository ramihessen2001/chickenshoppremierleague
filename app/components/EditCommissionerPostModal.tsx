/**
 * Compose or edit a commissioner's board post.
 *
 * Every post carries at most one piece of media. Editing an image post
 * without choosing a new file keeps the existing image -- the server only
 * replaces it when a new file actually comes through.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { CommissionerPost, CommissionerPostMediaType } from '@/types/commissionerPost'
import {
  createCommissionerPost,
  updateCommissionerPost,
  notifyDataUpdated,
} from '@/lib/supabaseData'
import { youTubeVideoId } from '@/lib/youtube'
import {
  Modal,
  FormError,
  fieldClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface EditCommissionerPostModalProps {
  /** Null when composing a new post. */
  post: CommissionerPost | null
  isOpen: boolean
  onClose: () => void
}

const MEDIA_OPTIONS: [CommissionerPostMediaType, string][] = [
  ['none', 'No media'],
  ['youtube', 'YouTube video'],
  ['image', 'Photo'],
]

export function EditCommissionerPostModal({
  post,
  isOpen,
  onClose,
}: EditCommissionerPostModalProps) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [body, setBody] = useState('')
  const [mediaType, setMediaType] = useState<CommissionerPostMediaType>('none')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setImageFile(null)
    if (fileInput.current) fileInput.current.value = ''

    if (post) {
      setBody(post.body)
      setMediaType(post.mediaType)
      setYoutubeUrl(post.mediaType === 'youtube' ? (post.mediaUrl ?? '') : '')
    } else {
      setBody('')
      setMediaType('none')
      setYoutubeUrl('')
    }
  }, [post, isOpen])

  const handleSave = async () => {
    setError(null)

    if (!body.trim()) {
      setError('Write something before posting')
      return
    }
    if (mediaType === 'youtube' && !youTubeVideoId(youtubeUrl)) {
      setError(
        'That does not look like a YouTube video link. Use the watch, live or youtu.be URL for the video itself, not a channel.'
      )
      return
    }
    if (mediaType === 'image' && !post && !imageFile) {
      setError('Choose a photo to upload')
      return
    }

    setIsSaving(true)
    try {
      const fields = {
        body: body.trim(),
        mediaType,
        mediaUrl: mediaType === 'youtube' ? youtubeUrl.trim() : undefined,
        imageFile: mediaType === 'image' ? imageFile : undefined,
      }

      if (post) {
        await updateCommissionerPost(post.id, fields)
      } else {
        await createCommissionerPost(fields)
      }

      notifyDataUpdated()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save the post')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={post ? 'Edit post' : 'New post'}
      size="sm"
      footer={
        <>
          <button onClick={onClose} disabled={isSaving} className={buttonSecondary}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className={buttonPrimary}>
            {isSaving ? 'Saving…' : 'Post'}
          </button>
        </>
      }
    >
      <FormError>{error}</FormError>

      <div className="space-y-5">
        <div>
          <label htmlFor="post-body" className={labelClass}>
            Message
          </label>
          <textarea
            id="post-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={fieldClass}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="post-media-type" className={labelClass}>
            Attach
          </label>
          <select
            id="post-media-type"
            value={mediaType}
            onChange={(e) => setMediaType(e.target.value as CommissionerPostMediaType)}
            className={fieldClass}
          >
            {MEDIA_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {mediaType === 'youtube' && (
          <div>
            <label htmlFor="post-youtube" className={labelClass}>
              YouTube link
            </label>
            <input
              id="post-youtube"
              type="text"
              placeholder="https://www.youtube.com/watch?v=…"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}

        {mediaType === 'image' && (
          <div>
            <label htmlFor="post-image" className={labelClass}>
              Photo
            </label>
            <input
              id="post-image"
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className={fieldClass}
            />
            {post?.mediaType === 'image' && (
              <p className="mt-1.5 text-[12px] text-ink-tertiary">
                Leave blank to keep the current photo.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
