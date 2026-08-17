/**
 * The commissioner's board: a running feed of posts from the league admin,
 * shown beside the homepage headline once the season is under way. Each
 * post is a short message with at most one piece of media -- a YouTube
 * video or a photo.
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react'
import { getCommissionerPosts, deleteCommissionerPost, notifyDataUpdated } from '@/lib/supabaseData'
import { useAdmin } from '@/lib/adminContext'
import { CommissionerPost } from '@/types/commissionerPost'
import { youTubeVideoId, youTubeEmbedUrl } from '@/lib/youtube'
import { EditCommissionerPostModal } from './EditCommissionerPostModal'

/** Coarse on purpose -- this is a homepage widget, not a precise clock. */
function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function CommissionersBoard() {
  const { isAdmin } = useAdmin()
  const [posts, setPosts] = useState<CommissionerPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [composing, setComposing] = useState(false)
  const [editing, setEditing] = useState<CommissionerPost | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = () => {
      getCommissionerPosts()
        .then(setPosts)
        .finally(() => setIsLoading(false))
    }
    load()
    window.addEventListener('dataUpdated', load)
    return () => window.removeEventListener('dataUpdated', load)
  }, [])

  const handleDelete = async (post: CommissionerPost) => {
    if (!confirm('Delete this post?')) return
    setError(null)
    try {
      await deleteCommissionerPost(post.id)
      notifyDataUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to delete the post')
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-hairline bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink-tertiary">
          <Megaphone size={14} />
          Commissioner&rsquo;s board
        </p>
        {isAdmin && (
          <button
            onClick={() => setComposing(true)}
            className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-surface-inverse px-3 py-1.5 text-[12.5px] font-medium text-ink-inverse transition-opacity hover:opacity-85"
          >
            <Plus size={13} />
            Post
          </button>
        )}
      </div>

      {error && (
        <p className="shrink-0 border-b border-hairline bg-negative-wash px-5 py-2.5 text-[13px] text-negative">
          {error}
        </p>
      )}

      <div className="max-h-[34rem] divide-y divide-hairline overflow-y-auto">
        {isLoading ? (
          <p className="px-5 py-10 text-center text-[14px] text-ink-tertiary">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="px-5 py-10 text-center text-[14px] text-ink-tertiary">
            {isAdmin
              ? 'Nothing posted yet — use "Post" to add the first update.'
              : 'Nothing posted yet.'}
          </p>
        ) : (
          posts.map((post) => {
            const videoId = post.mediaType === 'youtube' ? youTubeVideoId(post.mediaUrl) : null
            return (
              <article key={post.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-ink">
                    {post.body}
                  </p>
                  {isAdmin && (
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        onClick={() => setEditing(post)}
                        className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
                        aria-label="Edit post"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative"
                        aria-label="Delete post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {post.mediaType === 'image' && post.mediaUrl && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-hairline">
                    <Image
                      src={post.mediaUrl}
                      alt=""
                      width={640}
                      height={360}
                      className="h-auto w-full"
                    />
                  </div>
                )}

                {videoId && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-hairline bg-black">
                    <iframe
                      src={youTubeEmbedUrl(videoId)}
                      title="Commissioner's board video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="aspect-video w-full"
                    />
                  </div>
                )}

                <p className="mt-2.5 text-[12px] text-ink-tertiary">{timeAgo(post.createdAt)}</p>
              </article>
            )
          })
        )}
      </div>

      {isAdmin && (
        <>
          <EditCommissionerPostModal
            post={null}
            isOpen={composing}
            onClose={() => setComposing(false)}
          />
          <EditCommissionerPostModal
            post={editing}
            isOpen={editing !== null}
            onClose={() => setEditing(null)}
          />
        </>
      )}
    </div>
  )
}
