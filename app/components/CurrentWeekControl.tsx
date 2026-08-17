/**
 * The admin bar on the homepage: which phase the league is in, and which week
 * is featured while the season is running.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { LeaguePhase } from '@/lib/supabase'
import { updateLeagueConfig, notifyDataUpdated } from '@/lib/supabaseData'

interface CurrentWeekControlProps {
  phase: LeaguePhase
  currentWeek: number
  totalWeeks: number
  onWeekChange: (newWeek: number) => void
  /** Called after a change the parent should re-read config for. */
  onConfigChange?: () => void
}

/** In the order a season actually runs. */
const PHASES: [LeaguePhase, string][] = [
  ['signups', 'Signups'],
  ['draft', 'Draft'],
  ['season', 'Season'],
  ['playoffs', 'Playoffs'],
]

const PHASE_EXPLANATION: Record<LeaguePhase, string> = {
  signups: 'Registration form is open on the homepage.',
  draft: 'Draft under way. Assign players from the signups page.',
  season: 'Weekly fixtures on the homepage.',
  playoffs: 'Bracket and final on the homepage.',
}

export function CurrentWeekControl({
  phase,
  currentWeek,
  totalWeeks,
  onWeekChange,
  onConfigChange,
}: CurrentWeekControlProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (work: () => Promise<void>) => {
    setIsUpdating(true)
    setError(null)
    try {
      await work()
      notifyDataUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
    } finally {
      setIsUpdating(false)
    }
  }

  const changePhase = (next: LeaguePhase) =>
    run(async () => {
      await updateLeagueConfig({ phase: next })
      onConfigChange?.()
    })

  const changeWeek = (newWeek: number) => {
    if (newWeek < 1 || newWeek > totalWeeks || newWeek === currentWeek) return
    return run(async () => {
      await updateLeagueConfig({ currentWeek: newWeek })
      onWeekChange(newWeek)
    })
  }

  const stepButton =
    'flex h-8 w-8 items-center justify-center rounded-md border border-hairline-strong text-ink transition-colors hover:bg-surface-hover disabled:opacity-35 disabled:hover:bg-transparent'

  return (
    <div className="rounded-lg border border-hairline bg-surface-sunken p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-5">
        <div className="min-w-0">
          <p className="eyebrow">League phase</p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {PHASES.map(([value, label]) => (
              <button
                key={value}
                onClick={() => changePhase(value)}
                disabled={isUpdating || value === phase}
                aria-current={value === phase ? 'true' : undefined}
                className={`rounded-pill px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  value === phase
                    ? 'bg-surface-inverse text-ink-inverse'
                    : 'border border-hairline-strong text-ink hover:bg-surface-hover disabled:opacity-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-2.5 text-[13px] text-ink-tertiary">
            {PHASE_EXPLANATION[phase]}
            {(phase === 'signups' || phase === 'draft') && (
              <>
                {' '}
                <Link
                  href="/signups"
                  className="text-accent-ink transition-opacity hover:opacity-70"
                >
                  View registrations →
                </Link>
              </>
            )}
          </p>
        </div>

        {phase === 'season' && (
          <div className="flex items-center gap-4">
            <div>
              <p className="eyebrow">Current week</p>
              <p className="tabular mt-1 text-[15px] font-medium text-ink">
                Week {currentWeek}{' '}
                <span className="font-normal text-ink-tertiary">of {totalWeeks}</span>
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => changeWeek(currentWeek - 1)}
                disabled={currentWeek <= 1 || isUpdating}
                className={stepButton}
                aria-label="Previous week"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => changeWeek(currentWeek + 1)}
                disabled={currentWeek >= totalWeeks || isUpdating}
                className={stepButton}
                aria-label="Next week"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-[13px] text-negative" role="alert">
          {error}
        </p>
      )}
      {isUpdating && (
        <p className="mt-4 text-[13px] text-ink-tertiary">Updating…</p>
      )}
    </div>
  )
}
