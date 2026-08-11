/**
 * The whole season, week by week, with a playoff section when one exists.
 */

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Game } from '@/types/game'
import { WeekSection } from './WeekSection'
import { PageHeader } from './PageHeader'
import { BoxScoreModal } from './BoxScoreModal'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { EditGameModal } from './EditGameModal'
import { useAdmin } from '@/lib/adminContext'
import { getGameById } from '@/lib/supabaseData'

interface FullScheduleProps {
  games: Game[]
  currentWeek: number
  totalWeeks: number
  season?: string | null
}

export function FullSchedule({
  games,
  currentWeek,
  totalWeeks,
  season,
}: FullScheduleProps) {
  const { isAdmin } = useAdmin()
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

  // Group by week, each week ordered by date then kickoff.
  const byWeek = new Map<number, Game[]>()
  for (const game of games) {
    if (!byWeek.has(game.weekNumber)) byWeek.set(game.weekNumber, [])
    byWeek.get(game.weekNumber)!.push(game)
  }
  for (const weekGames of byWeek.values()) {
    weekGames.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
  }

  const playoffGames = byWeek.get(0) ?? []
  const hasAnyGames = games.length > 0

  return (
    <>
      <PageHeader
        eyebrow={season ?? undefined}
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
      />

      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
          <WeekSection
            key={week}
            weekNumber={week}
            games={byWeek.get(week) ?? []}
            isCurrentWeek={week === currentWeek}
            onGameClick={handleView}
            onEditBoxScore={isAdmin ? handleEditBoxScore : undefined}
            onEditGame={isAdmin ? handleEditGame : undefined}
            onAddGame={isAdmin ? () => handleAddGame(week) : undefined}
          />
        ))}

        {playoffGames.length > 0 && (
          <WeekSection
            weekNumber={0}
            games={playoffGames}
            isCurrentWeek={false}
            onGameClick={handleView}
            onEditBoxScore={isAdmin ? handleEditBoxScore : undefined}
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
      <EditBoxScoreModal
        game={gameForBoxScore}
        isOpen={isBoxScoreOpen}
        onClose={() => setIsBoxScoreOpen(false)}
      />
      <EditGameModal
        game={gameForDetails}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        defaultWeek={newGameWeek}
      />
    </>
  )
}
