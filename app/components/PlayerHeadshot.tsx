/**
 * A player's portrait, or their initials until there is one.
 *
 * Photos arrive a few at a time over a season, so this looks for a file named
 * after the player before it gives up: drop yaseen-jawhar.jpg into
 * /public/images/players and it appears, with no database edit. An explicit
 * headshot_url always wins, for names that do not slug cleanly.
 *
 * A plain <img> rather than next/image: this walks a list of candidate paths
 * on error, and each miss through the image optimiser would be a request that
 * buys nothing. There is one of these on screen at a time, in a dialog.
 */

'use client'

import { useState } from 'react'

/** Order matters only in that the common case should be first. */
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

/** "Hamza H. Abdushaheed" -> "hamza-h-abdushaheed" */
export function headshotSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function candidates(name: string, explicit?: string | null): string[] {
  const slug = headshotSlug(name)
  const guesses = slug ? EXTENSIONS.map((ext) => `/images/players/${slug}.${ext}`) : []
  return explicit ? [explicit, ...guesses] : guesses
}

/** Up to two letters, so a long name does not turn into a wall of capitals. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  const first = words[0][0]
  const last = words.length > 1 ? words[words.length - 1][0] : ''
  return (first + last).toUpperCase()
}

interface PlayerHeadshotProps {
  name: string
  headshotUrl?: string | null
  /** Rendered size in pixels. Square. */
  size?: number
  className?: string
}

export function PlayerHeadshot({
  name,
  headshotUrl,
  size = 96,
  className = '',
}: PlayerHeadshotProps) {
  const paths = candidates(name, headshotUrl)

  /*
   * A different player in the same dialog reuses this component, so the walk
   * has to start over or they inherit the previous player's exhausted list.
   *
   * The subject is stored alongside the position rather than reset from an
   * effect: an effect would render the old player's initials for a frame
   * before correcting itself, and this is the pattern React documents for
   * adjusting state when props change.
   */
  const subject = `${name}|${headshotUrl ?? ''}`
  const [walk, setWalk] = useState({ subject, index: 0 })
  if (walk.subject !== subject) setWalk({ subject, index: 0 })

  const index = walk.subject === subject ? walk.index : 0
  const exhausted = index >= paths.length

  return (
    <div
      className={`shrink-0 overflow-hidden border border-hairline-strong bg-surface-sunken ${className}`}
      style={{ width: size, height: size }}
    >
      {exhausted ? (
        <div
          className="flex h-full w-full items-center justify-center font-display font-bold uppercase tracking-[0.02em] text-ink-tertiary"
          style={{ fontSize: size * 0.34 }}
          aria-hidden="true"
        >
          {initials(name)}
        </div>
      ) : (
        /* The fallback chain walks candidate paths, and each miss through the
           image optimiser would be a request that buys nothing. See the note
           at the top of this file. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={paths[index]}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setWalk((w) => ({ subject, index: w.index + 1 }))}
        />
      )}
    </div>
  )
}
