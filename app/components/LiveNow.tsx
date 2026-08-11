/**
 * Live games, with the YouTube stream embedded.
 *
 * A game counts as live when it has a stream URL and its status is
 * `in_progress`. There is no separate "is live" switch, so a stream cannot be
 * left showing as live after full time -- marking the game completed is enough.
 *
 * Renders nothing when nothing is live, so it costs the homepage nothing the
 * rest of the week.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Game } from '@/types/game'
import { getAllGames } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'
import { youTubeEmbedUrl, youTubeVideoId, youTubeWatchUrl } from '@/lib/youtube'

export function LiveNow() {
  const { teamName, teamLogo } = useTeams()
  const [liveGames, setLiveGames] = useState<Game[]>([])

  const load = useCallback(async () => {
    const games = await getAllGames()
    setLiveGames(
      games.filter((game) => game.status === 'in_progress' && game.streamUrl)
    )
  }, [])

  useEffect(() => {
    // load() is async, so its setState runs after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()

    // Re-check periodically so a stream appears without the viewer reloading.
    const interval = setInterval(load, 60_000)
    const handleUpdate = () => load()
    window.addEventListener('dataUpdated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('dataUpdated', handleUpdate)
    }
  }, [load])

  if (liveGames.length === 0) return null

  return (
    <section
      className="border-b border-hairline bg-surface-sunken"
      aria-labelledby="live-heading"
    >
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-negative opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-negative" />
          </span>
          <h2
            id="live-heading"
            className="text-[13px] font-semibold uppercase tracking-[0.08em] text-negative"
          >
            Live now
          </h2>
        </div>

        <div
          className={`mt-6 grid gap-8 ${
            liveGames.length > 1 ? 'lg:grid-cols-2' : ''
          }`}
        >
          {liveGames.map((game) => {
            const videoId = youTubeVideoId(game.streamUrl)
            const homeName = teamName(game.homeTeamId)
            const awayName = teamName(game.awayTeamId)

            return (
              <article key={game.id}>
                <div className="flex items-center gap-3">
                  {game.homeTeamId && (
                    <Image
                      src={teamLogo(game.homeTeamId)}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 shrink-0 object-contain"
                    />
                  )}
                  <h3 className="min-w-0 truncate text-[17px] font-semibold text-ink">
                    {homeName}{' '}
                    <span className="font-normal text-ink-tertiary">v</span>{' '}
                    {awayName}
                  </h3>
                  {game.awayTeamId && (
                    <Image
                      src={teamLogo(game.awayTeamId)}
                      alt=""
                      width={24}
                      height={24}
                      className="h-6 w-6 shrink-0 object-contain"
                    />
                  )}
                </div>

                {videoId ? (
                  <div className="mt-4 overflow-hidden rounded-lg border border-hairline bg-black">
                    {/* 16:9, held by aspect-ratio so it scales on any width. */}
                    <iframe
                      src={youTubeEmbedUrl(videoId)}
                      title={`${homeName} versus ${awayName}, live`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="aspect-video w-full"
                    />
                  </div>
                ) : (
                  // The URL is not a recognisable YouTube video -- most likely a
                  // channel link. Link out rather than embedding nothing.
                  <a
                    href={game.streamUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 block rounded-lg border border-hairline bg-surface px-5 py-8 text-center transition-colors hover:bg-surface-hover"
                  >
                    <p className="text-[15px] font-medium text-ink">
                      Watch on YouTube
                    </p>
                    <p className="mt-1 text-[13px] text-ink-tertiary">
                      Opens in a new tab
                    </p>
                  </a>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-tertiary">
                  {game.location && <span>{game.location}</span>}
                  {videoId && (
                    <a
                      href={youTubeWatchUrl(videoId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-ink transition-opacity hover:opacity-70"
                    >
                      Open on YouTube →
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
