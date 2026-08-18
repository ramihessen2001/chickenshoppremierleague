/**
 * Archives the current season and resets the live tables for the next one.
 *
 * Deliberately harder to trigger than any other admin action on the site:
 * this deletes every player, game and stat the season has -- after copying
 * them into the archive first, but there's no undo once it's run for real.
 * The admin has to type the season label back before the button that
 * actually does it becomes clickable.
 *
 * Not available in the local test sandbox (see lib/devSandbox.ts) -- this
 * always writes to the real Supabase project, on purpose, so it can only
 * ever be run deliberately.
 */

'use client'

import { useState } from 'react'
import { Archive } from 'lucide-react'
import { archiveSeason, notifyDataUpdated } from '@/lib/supabaseData'
import { buttonSecondary, fieldClass, labelClass } from './Modal'

interface ArchiveSeasonControlProps {
  /** Pre-fills the confirmation field, e.g. the league's current season label. */
  currentSeasonLabel: string
}

export function ArchiveSeasonControl({ currentSeasonLabel }: ArchiveSeasonControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const matches = confirmText.trim() === currentSeasonLabel.trim() && currentSeasonLabel.trim() !== ''

  const handleArchive = async () => {
    if (!matches) return
    setError(null)
    setIsWorking(true)
    try {
      await archiveSeason(currentSeasonLabel.trim())
      notifyDataUpdated()
      setDone(true)
      setIsOpen(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to archive the season')
    } finally {
      setIsWorking(false)
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-hairline bg-surface-sunken px-4 py-3 text-[13px] text-ink-secondary">
        &ldquo;{currentSeasonLabel}&rdquo; is archived. Rosters, games, stats and standings are
        cleared for the next season.
      </p>
    )
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-pill border border-hairline-strong px-4 py-2 text-[13px] font-medium text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink"
      >
        <Archive size={14} />
        Archive &amp; reset season
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-negative/30 bg-negative-wash px-5 py-4">
      <p className="text-[13px] font-semibold text-ink">Archive &amp; reset &ldquo;{currentSeasonLabel}&rdquo;</p>
      <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-secondary">
        Copies every roster, game, stat and standing into a read-only archive, then permanently
        deletes them from the live site so the next season starts empty. Teams themselves aren&rsquo;t
        touched. This cannot be undone.
      </p>

      <label htmlFor="archive-confirm" className={`${labelClass} mt-4`}>
        Type the season name to confirm
      </label>
      <input
        id="archive-confirm"
        type="text"
        placeholder={currentSeasonLabel}
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className={`max-w-xs ${fieldClass}`}
        autoComplete="off"
      />

      {error && <p className="mt-3 text-[13px] text-negative">{error}</p>}

      <div className="mt-4 flex items-center gap-2.5">
        <button
          onClick={() => {
            setIsOpen(false)
            setConfirmText('')
            setError(null)
          }}
          disabled={isWorking}
          className={buttonSecondary}
        >
          Cancel
        </button>
        <button
          onClick={handleArchive}
          disabled={!matches || isWorking}
          className="rounded-pill bg-negative px-4 py-2 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-40"
        >
          {isWorking ? 'Archiving…' : 'Archive & reset, permanently'}
        </button>
      </div>
    </div>
  )
}
