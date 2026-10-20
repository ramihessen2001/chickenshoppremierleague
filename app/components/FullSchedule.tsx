/**
 * The whole season, week by week, then any games waiting to be rescheduled,
 * then a playoff section when one exists.
 */

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Game } from '@/types/game'
import { WeekSection } from './WeekSection'
import { PageHeader } from './PageHeader'
import { BoxScoreModal } from './BoxScoreModal'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { StatkeeperBoxScoreModal } from './StatkeeperBoxScoreModal'
import { EditGameModal } from './EditGameModal'
import { SeasonScheduler } from './SeasonScheduler'
import { useAdmin } from '@/lib/adminContext'
import { useStatkeeper } from '@/lib/statkeeperContext'
import { getGameById } from '@/lib/supabaseData'
import { compareGameTimes, isAwaitingReschedule } from '@/lib/dateUtils'

interface FullScheduleProps {
  games: Game[]
  currentWeek: number
  totalWeeks: number
}

export function FullSchedule({
  games,
  currentWeek,
  totalWeeks,
}: FullScheduleProps) {
  const { isAdmin } = useAdmin()
  const { isStatkeeper } = useStatkeeper()
  const canRecordStats = isAdmin || isStatkeeper
  const [gameForView, setGameForView] = useState<Game | null>(null)
  const [gameForBoxScore, setGameForBoxScore] = useState<Game | null>(null)
  const [gameForDetails, setGameForDetails] = useState<Game | null>(null)
  const [newGameWeek, setNewGameWeek] = useState<number | undefined>()
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isBoxScoreOpen, setIsBoxScoreOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const handleView = async (game: Game) => {
    const full = await getGameById(game.id)
    if (full) {
      setGameForView(full)
      setIsViewOpen(true)
    }
  }

  const handleEditBoxScore = async (game: Game) => {
    const full = await getGameById(game.id)
    if (full) {
      setGameForBoxScore(full)
      setIsBoxScoreOpen(true)
    }
  }

  const handleEditGame = (game: Game) => {
    setGameForDetails(game)
    setNewGameWeek(undefined)
    setIsDetailsOpen(true)
  }

  const handleAddGame = (weekNumber: number) => {
    setGameForDetails(null)
    setNewGameWeek(weekNumber)
    setIsDetailsOpen(true)
  }

  // Regular-season games waiting to be rescheduled belong to no week yet: their
  // stored date and week no longer hold, so they leave the weeks and are listed
  // together after the last one. Rescheduling one (a new date and week, status
  // back to scheduled) moves it into its new week. Playoff games stay in the
  // playoff section either way.
  const awaiting = games.filter((g) => g.weekNumber > 0 && isAwaitingReschedule(g))
  const dated = games.filter((g) => !(g.weekNumber > 0 && isAwaitingReschedule(g)))

  // Group by week, each week ordered by date then kickoff.
  const byWeek = new Map<number, Game[]>()
  for (const game of dated) {
    if (!byWeek.has(game.weekNumber)) byWeek.set(game.weekNumber, [])
    byWeek.get(game.weekNumber)!.push(game)
  }
  for (const weekGames of byWeek.values()) {
    weekGames.sort((a, b) => a.date.localeCompare(b.date) || compareGameTimes(a.time, b.time))
  }

  const playoffGames = byWeek.get(0) ?? []
  const hasAnyGames = games.length > 0

  return (
    <>
      <PageHeader
        title="Schedule"
        description={
          hasAnyGames
            ? `${totalWeeks} weeks. Currently week ${currentWeek}.`
            : 'No fixtures have been added yet.'
        }
        actions={
          isAdmin ? (
            <button
              onClick={() => handleAddGame(currentWeek)}
              className="inline-flex items-center gap-1.5 rounded-pill bg-surface-inverse px-4 py-2 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85"
            >
              <Plus size={15} />
              Add game
            </button>
          ) : undefined
        }
      >
        <SeasonScheduler hasGames={hasAnyGames} />
      </PageHeader>

      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
          <WeekSection
            key={week}
            weekNumber={week}
            games={byWeek.get(week) ?? []}
            isCurrentWeek={week === currentWeek}
            onGameClick={handleView}
            onEditBoxScore={canRecordStats ? handleEditBoxScore : undefined}
            onEditGame={isAdmin ? handleEditGame : undefined}
            onAddGame={isAdmin ? () => handleAddGame(week) : undefined}
          />
        ))}

        {awaiting.length > 0 && (
          <WeekSection
            title="To be rescheduled"
            weekNumber={-1}
            games={awaiting}
            isCurrentWeek={false}
            onGameClick={handleView}
            onEditBoxScore={canRecordStats ? handleEditBoxScore : undefined}
            onEditGame={isAdmin ? handleEditGame : undefined}
          />
        )}

        {playoffGames.length > 0 && (
          <WeekSection
            weekNumber={0}
            games={playoffGames}
            isCurrentWeek={false}
            onGameClick={handleView}
            onEditBoxScore={canRecordStats ? handleEditBoxScore : undefined}
            onEditGame={isAdmin ? handleEditGame : undefined}
            onAddGame={isAdmin ? () => handleAddGame(0) : undefined}
          />
        )}
      </div>

      <BoxScoreModal
        game={gameForView}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      />
      {isAdmin ? (
        <EditBoxScoreModal
          game={gameForBoxScore}
          isOpen={isBoxScoreOpen}
          onClose={() => setIsBoxScoreOpen(false)}
        />
      ) : (
        <StatkeeperBoxScoreModal
          game={gameForBoxScore}
          isOpen={isBoxScoreOpen}
          onClose={() => setIsBoxScoreOpen(false)}
        />
      )}
      <EditGameModal
        game={gameForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        defaultWeek={newGameWeek}
      />
    </>
  )
}
