/**
 * Turning a YouTube link into something embeddable.
 *
 * Admins paste whatever the address bar or the share sheet gave them, which is
 * one of several shapes. Rather than demanding a specific format, we accept the
 * common ones and normalise.
 */

/**
 * Extracts the video id from any usual YouTube URL:
 *
 *   https://www.youtube.com/watch?v=ID
 *   https://youtu.be/ID
 *   https://www.youtube.com/live/ID
 *   https://www.youtube.com/embed/ID
 *   https://www.youtube.com/shorts/ID
 *
 * Returns null for anything else, including a bare channel link -- a channel
 * has no single video to embed.
 */
export function youTubeVideoId(url: string | null | undefined): string | null {
  if (!url) return null

  let parsed: URL
  try {
    parsed = new URL(url.trim())
  } catch {
    return null
  }

  const host = parsed.hostname.replace(/^www\./, '').toLowerCase()

  if (host === 'youtu.be') {
    return cleanId(parsed.pathname.slice(1))
  }

  if (host !== 'youtube.com' && host !== 'm.youtube.com') return null

  const fromQuery = parsed.searchParams.get('v')
  if (fromQuery) return cleanId(fromQuery)

  const match = parsed.pathname.match(/^\/(?:live|embed|shorts|v)\/([^/]+)/)
  return match ? cleanId(match[1]) : null
}

/** YouTube ids are 11 characters of [A-Za-z0-9_-]. */
function cleanId(candidate: string): string | null {
  const id = candidate.split(/[?&#]/)[0]
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
}

/** The privacy-preserving embed URL for a video id. */
export function youTubeEmbedUrl(videoId: string): string {
  // youtube-nocookie avoids setting tracking cookies until the viewer plays.
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`
}

/** A canonical watch URL, for the "open on YouTube" fallback link. */
export function youTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}
