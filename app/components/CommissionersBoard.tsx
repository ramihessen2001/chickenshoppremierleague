/**
 * The commissioner's board: a running feed of posts from the league admin,
 * shown beside the homepage headline once the season is under way. Each
 * post is a short message with at most one piece of media -- a YouTube
 * video or a photo.
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { getCommissionerPosts, deleteCommissionerPost, notifyDataUpdated } from '@/lib/supabaseData'
import { useAdmin } from '@/lib/adminContext'
import { LEAGUE } from '@/config/league'
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
    /*
     * The height is capped on the board rather than on the feed inside it.
     * Capping the feed left the surrounding card free to grow, so a couple of
     * posts with video in them pushed everything else on the homepage below
     * the fold. Bounded here, the feed simply scrolls within whatever room
     * the board has.
     */
    <div className="flex h-full max-h-[26rem] flex-col border border-hairline sm:max-h-[32rem]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-hairline px-5 py-4">
        <p className="flex items-center gap-2 font-util text-[10.5px] uppercase tracking-[0.1em] text-ink-secondary">
          {/* The black wordmark: this header sits on a light surface. */}
          <Image
            src={LEAGUE.wordmarkUrl}
            alt=""
            width={128}
            height={40}
            className="h-3.5 w-auto object-contain"
          />
          Commissioner&rsquo;s board
        </p>
        {isAdmin && (
          <button
            onClick={() => setComposing(true)}
            className="inline-flex shrink-0 items-center gap-1 bg-ink px-3 py-1.5 font-display text-[12px] font-bold uppercase tracking-[0.06em] text-ink-inverse transition-colors hover:bg-red"
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

      <div className="min-h-0 flex-1 divide-y divide-hairline overflow-y-auto">
        {isLoading ? (
          <p className="loading px-5 py-6">Loading</p>
        ) : posts.length === 0 ? (
          <p className="loading px-5 py-6">
            {isAdmin ? 'Nothing posted yet — use Post to add the first update' : 'Nothing posted yet'}
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
                        className="p-1.5 text-ink-tertiary transition-colors hover:bg-ink/[0.06] hover:text-ink"
                        aria-label="Edit post"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-1.5 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative"
                        aria-label="Delete post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {post.mediaType === 'image' && post.mediaUrl && (
                  <div className="mt-3 overflow-hidden border border-hairline">
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
                  <div className="mt-3 overflow-hidden border border-hairline bg-black">
                    <iframe
                      src={youTubeEmbedUrl(videoId)}
                      title="Commissioner's board video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="aspect-video w-full"
                    />
                  </div>
                )}

                <p className="mt-2.5 font-util text-[11px] uppercase tracking-[0.06em] text-ink-tertiary">
                  {timeAgo(post.createdAt)}
                </p>
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
