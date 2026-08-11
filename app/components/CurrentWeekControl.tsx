/**
 * Admin control for which week the homepage features, and the switch that hands
 * the homepage over to the playoff bracket.
 */

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { updateLeagueConfig, notifyDataUpdated } from '@/lib/supabaseData'

interface CurrentWeekControlProps {
  currentWeek: number
  totalWeeks: number
  playoffsStarted: boolean
  onWeekChange: (newWeek: number) => void
  /** Called after a change the parent should re-read config for. */
  onConfigChange?: () => void
}

export function CurrentWeekControl({
  currentWeek,
  totalWeeks,
  playoffsStarted,
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

  const changeWeek = (newWeek: number) => {
    if (newWeek < 1 || newWeek > totalWeeks || newWeek === currentWeek) return
    return run(async () => {
      await updateLeagueConfig({ currentWeek: newWeek })
      onWeekChange(newWeek)
    })
  }

  const togglePlayoffs = () =>
    run(async () => {
      await updateLeagueConfig({ playoffsStarted: !playoffsStarted })
      onConfigChange?.()
    })

  const stepButton =
    'flex h-8 w-8 items-center justify-center rounded-md border border-hairline-strong text-ink transition-colors hover:bg-surface-hover disabled:opacity-35 disabled:hover:bg-transparent'

  return (
    <div className="rounded-lg border border-hairline bg-surface-sunken p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
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

        <div className="flex items-center gap-4">
          <div>
            <p className="eyebrow">Homepage</p>
            <p className="mt-1 text-[15px] text-ink">
              {playoffsStarted ? 'Playoff bracket' : 'Weekly fixtures'}
            </p>
          </div>
          <button
            onClick={togglePlayoffs}
            disabled={isUpdating}
            className="rounded-pill border border-hairline-strong px-4 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            {playoffsStarted ? 'Show fixtures' : 'Start playoffs'}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-[13px] text-negative" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
