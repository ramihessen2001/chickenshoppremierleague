/**
 * The league-wide livestream, shown at the top of the homepage in place of
 * the headline and the commissioner's board while `league_config.
 * live_stream_url` is set.
 *
 * Unlike LiveNow, which follows a single game's status, this has nothing to
 * end it automatically: it shows until the admin clears the link from the
 * admin bar.
 */

import { youTubeEmbedUrl, youTubeVideoId, youTubeWatchUrl } from '@/lib/youtube'

export function LiveStreamHero({ url }: { url: string }) {
  const videoId = youTubeVideoId(url)

  return (
    <div>
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-negative opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-negative" />
        </span>
        <h2
          id="livestream-heading"
          className="text-[13px] font-semibold uppercase tracking-[0.08em] text-negative"
        >
          Live now
        </h2>
      </div>

      {videoId ? (
        <>
          <div className="mt-6 overflow-hidden border border-hairline bg-black">
            {/* 16:9, held by aspect-ratio so it scales on any width. */}
            <iframe
              src={youTubeEmbedUrl(videoId)}
              title="League livestream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="aspect-video w-full"
            />
          </div>
          <a
            href={youTubeWatchUrl(videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[13px] text-accent-ink transition-opacity hover:opacity-70"
          >
            Open on YouTube →
          </a>
        </>
      ) : (
        // Not a recognisable YouTube video -- most likely a channel link, or
        // another platform. Link out rather than embedding nothing.
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block border border-hairline bg-surface px-5 py-12 text-center transition-colors hover:bg-surface-hover"
        >
          <p className="text-[17px] font-medium text-ink">Watch the livestream</p>
          <p className="mt-1 text-[13px] text-ink-tertiary">Opens in a new tab</p>
        </a>
      )}
    </div>
  )
}
