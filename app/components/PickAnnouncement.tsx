/**
 * The full-screen card that announces a pick.
 *
 * Stays until someone clicks it or presses Escape -- it holds the room's
 * attention rather than timing out mid-announcement, and the next pick cannot
 * be made behind it by accident.
 *
 * Driven by the board rather than by the click that made the pick, so it fires
 * on every device following the draft -- the projector at the front and the
 * phones in the room -- not only on the admin console. Whoever opens the board
 * mid-draft gets no announcement for picks that happened before they arrived;
 * the first board they load only sets the baseline.
 *
 * Black ground, because this is the one moment the site interrupts the room.
 * --court would fail against it, so the accents here are --wash, which is the
 * substitution the system specifies for dark surfaces.
 */

'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { lightenForContrast } from '@/lib/contrast'

export interface AnnouncedPick {
  pickNumber: number
  round: number
  playerName: string
  jerseyNumber: number | null
  teamName: string
  teamLogoUrl: string | null
  /** The club's own colour, as stored. Lightened here if it needs it. */
  teamColor: string | null
}

/** The ground this card is drawn on; club colours are read against it. */
const GROUND = '#0d0d0d'

export function PickAnnouncement({
  pick,
  onDismiss,
}: {
  pick: AnnouncedPick | null
  onDismiss: () => void
}) {
  useEffect(() => {
    if (!pick) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pick, onDismiss])

  if (!pick) return null

  return (
    <div
      onClick={onDismiss}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-8 bg-black px-6 text-center"
    >
      <p className="font-util text-[13px] uppercase tracking-[0.24em] text-wash sm:text-[15px]">
        Pick {pick.pickNumber} · Round {pick.round}
      </p>

      {pick.teamLogoUrl && (
        <Image
          src={pick.teamLogoUrl}
          alt=""
          width={280}
          height={280}
          priority
          className="h-32 w-32 object-contain sm:h-44 sm:w-44"
        />
      )}

      {/* A player is a thing, not a section, so the name is upright condensed
          rather than the oblique the page titles use. `not-italic` is doing
          real work: this is an h2, and the base heading rule slants it. */}
      <h2 className="max-w-[18ch] font-display text-[13vw] font-bold uppercase not-italic leading-[0.92] tracking-[0.01em] text-ink-inverse sm:text-[86px]">
        {pick.playerName}
      </h2>

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <p
          className="font-display text-[24px] font-bold uppercase tracking-[0.02em] sm:text-[32px]"
          style={{ color: lightenForContrast(pick.teamColor, GROUND) }}
        >
          {pick.teamName}
        </p>
        {pick.jerseyNumber !== null && (
          <p className="border border-rule-inverse px-3 py-1 font-util text-[18px] font-bold text-ink-inverse sm:text-[22px]">
            #{pick.jerseyNumber}
          </p>
        )}
      </div>

    </div>
  )
}
