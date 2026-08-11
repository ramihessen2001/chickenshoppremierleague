/**
 * The current week's fixtures.
 *
 * Each fixture is a two-row block -- crest, name, score -- the way a results
 * page reads, rather than a card shouting the matchup. Scores use tabular
 * figures so digits line up between fixtures.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { Game } from '@/types/game'
import { displayJersey } from '@/types/player'
import { useTeams } from '@/lib/teamsContext'
import { LEAGUE } from '@/config/league'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { BoxScoreModal } from './BoxScoreModal'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { useAdmin } from '@/lib/adminContext'
import { getGameById } from '@/lib/supabaseData'

interface WeeklyGamesProps {
  games: Game[]
  weekNumber: number
}

export function WeeklyGames({ games, weekNumber }: WeeklyGamesProps) {
  const { isAdmin } = useAdmin()
  const [gameForView, setGameForView] = useState<Game | null>(null)
  const [gameForEdit, setGameForEdit] = useState<Game | null>(null)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const open = async (game: Game, edit: boolean) => {
    const full = (await getGameById(game.id)) ?? game
    if (edit) {
      setGameForEdit(full)
      setIsEditOpen(true)
    } else {
      setGameForView(full)
      setIsViewOpen(true)
    }
  }

  return (
    <>
      <section
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8"
        aria-labelledby="fixtures-heading"
      >
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">Week {weekNumber}</p>
            <h2
              id="fixtures-heading"
              className="mt-2 text-[28px] font-semibold text-ink sm:text-[32px]"
            >
              Fixtures
            </h2>
          </div>
          <Link
            href="/schedule"
            className="shrink-0 text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-70"
          >
            Full season →
          </Link>
        </div>

        {games.length === 0 ? (
          <p className="mt-10 text-[15px] text-ink-tertiary">
            No fixtures scheduled for this week.
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {games.map((game) => (
              <li key={game.id}>
                <FixtureCard
                  game={game}
                  onOpen={() => open(game, false)}
                  onEdit={isAdmin ? () => open(game, true) : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <BoxScoreModal
        game={gameForView}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      />
      <EditBoxScoreModal
        game={gameForEdit}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  )
}

interface FixtureCardProps {
  game: Game
  onOpen: () => void
  onEdit?: () => void
}

function FixtureCard({ game, onOpen, onEdit }: FixtureCardProps) {
  const { teamName, teamLogo } = useTeams()
  const homeName = teamName(game.homeTeamId)
  const awayName = teamName(game.awayTeamId)

  const played = game.homeScore !== null && game.awayScore !== null
  const homeWon = played && game.homeScore! > game.awayScore!
  const awayWon = played && game.awayScore! > game.homeScore!

  return (
    <div className="group relative">
      <button
        onClick={onOpen}
        className="w-full rounded-lg border border-hairline bg-surface p-5 text-left transition-colors hover:bg-surface-hover"
        aria-label={`${homeName} versus ${awayName}, box score`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="tabular text-[12px] text-ink-tertiary">
            {formatDate(game.date)} · {formatTime(game.time)}
          </p>
          {played ? (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
              Final
            </span>
          ) : (
            game.status !== 'scheduled' && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-ink">
                {game.status}
              </span>
            )
          )}
        </div>

        <div className="mt-4 space-y-2.5">
          <TeamLine
            logo={game.homeTeamId ? teamLogo(game.homeTeamId) : null}
            name={homeName}
            score={game.homeScore}
            played={played}
            won={homeWon}
          />
          <TeamLine
            logo={game.awayTeamId ? teamLogo(game.awayTeamId) : null}
            name={awayName}
            score={game.awayScore}
            played={played}
            won={awayWon}
          />
        </div>

        {game.location && (
          <p className="mt-4 truncate text-[12px] text-ink-tertiary">{game.location}</p>
        )}

        {game.playerOfGame && (
          <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-3">
            <Image
              src={LEAGUE.manOfTheMatch.badgeImageUrl}
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px] shrink-0 rounded-full object-contain"
            />
            <p className="truncate text-[12px] text-ink-secondary">
              <span className="text-ink-tertiary">Man of the match · </span>
              <span className="font-medium text-ink">{game.playerOfGame.name}</span>
              <span className="tabular text-ink-tertiary">
                {' '}
                #{displayJersey(game.playerOfGame.jerseyNumber)}
              </span>
            </p>
          </div>
        )}
      </button>

      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="absolute right-3 top-3 rounded-md p-1.5 text-ink-tertiary opacity-0 transition-opacity hover:bg-surface-sunken hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
          aria-label="Edit box score"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  )
}

/** One team's line within a fixture: crest, name, score. */
function TeamLine({
  logo,
  name,
  score,
  played,
  won,
}: {
  logo: string | null
  name: string
  score: number | null
  played: boolean
  won: boolean
}) {
  // Once a game is played the loser recedes, so a glance reads the result.
  const dim = played && !won

  return (
    <div className="flex items-center gap-3">
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
        />
      ) : (
        <div className="h-7 w-7 shrink-0 rounded-full bg-surface-sunken" />
      )}
      <span
        className={`flex-1 truncate text-[15px] ${
          dim ? 'text-ink-secondary' : 'font-medium text-ink'
        }`}
      >
        {name}
      </span>
      {played && (
        <span
          className={`tabular text-[17px] ${
            won ? 'font-semibold text-ink' : 'text-ink-secondary'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}
