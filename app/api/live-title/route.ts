/**
 * The title of a YouTube video or stream, for the homepage livestream block.
 *
 *   GET ?url=<YouTube link> -> { title }
 *
 * Read from YouTube's public oEmbed endpoint, which needs no API key but sends
 * no CORS headers, so the browser cannot call it directly. Only a recognisable
 * YouTube video id is ever passed on -- the request YouTube receives is built
 * here from that id, never from the raw link -- so this cannot be used to make
 * the server fetch anything else. Cached for five minutes: a stream's title
 * rarely changes mid-broadcast, and every visitor asks for the same one.
 */

import { NextResponse } from 'next/server'
import { fail } from '@/lib/apiAuth'
import { youTubeVideoId, youTubeWatchUrl } from '@/lib/youtube'

export async function GET(request: Request) {
  const videoId = youTubeVideoId(new URL(request.url).searchParams.get('url'))
  if (!videoId) return fail('Not a YouTube video link')

  const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(
    youTubeWatchUrl(videoId)
  )}`

  try {
    const response = await fetch(oembed, { next: { revalidate: 300 } })
    if (!response.ok) return fail('Title not available', 404)
    const data = (await response.json()) as { title?: unknown }
    if (typeof data.title !== 'string' || !data.title.trim()) {
      return fail('Title not available', 404)
    }
    return NextResponse.json(
      { title: data.title.trim() },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    return fail('Title not available', 502)
  }
}
