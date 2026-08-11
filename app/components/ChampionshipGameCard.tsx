/**
 * The championship final.
 *
 * Renders whichever game carries playoff_round = 'final', and nothing at all
 * until one exists. Once the result is in, it names the champion.
 */

'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '@/lib/adminContext'
import { useTeams } from '@/lib/teamsContext'
import { Game } from '@/types/game'
import { getPlayoffGames } from '@/lib/supabaseData'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { BoxScoreModal } from './BoxScoreModal'

export function ChampionshipGameCard() {
  const { isAdmin } = useAdmin()
  const { teamName, teamLogo } = useTeams()
  const [game, setGame] = useState<Game | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const playoffGames = await getPlayoffGames()
      setGame(playoffGames.find((g) => g.playoffRound === 'final') ?? null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const handleUpdate = () => load()
    window.addEventListener('dataUpdated', handleUpdate)
    return () => window.removeEventListener('dataUpdated', handleUpdate)
  }, [load])

  if (isLoading || !game) return null

  const played = game.homeScore !== null && game.awayScore !== null
  const homeName = teamName(game.homeTeamId)
  const awayName = teamName(game.awayTeamId)

  const champion =
    played && game.status === 'completed'
      ? game.homeScore! > game.awayScore!
        ? homeName
        : game.awayScore! > game.homeScore!
          ? awayName
          : null
      : null

  const Side = ({
    slug,
    name,
    score,
  }: {
    slug: string
    name: string
    score: number | null
  }) => {
    const won = played && name === champion
    return (
      <div className="flex flex-1 flex-col items-center gap-4 text-center">
        {slug ? (
          <Image
            src={teamLogo(slug)}
            alt=""
            width={88}
            height={88}
            className="h-16 w-16 object-contain sm:h-[88px] sm:w-[88px]"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-sunken text-[12px] text-ink-tertiary sm:h-[88px] sm:w-[88px]">
            TBD
          </div>
        )}
        <p
          className={`text-[15px] sm:text-[17px] ${
            played && !won ? 'text-ink-secondary' : 'font-semibold text-ink'
          }`}
        >
          {name}
        </p>
        {played && (
          <p
            className={`tabular text-[44px] leading-none sm:text-[56px] ${
              won ? 'font-semibold text-ink' : 'font-normal text-ink-secondary'
            }`}
          >
            {score}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <section className="border-y border-hairline bg-surface-sunken">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="text-center">
            <p className="eyebrow">Final</p>
            <h2 className="mt-3 text-[32px] font-semibold text-ink sm:text-[40px]">
              {champion ? `${champion} are champions` : 'Championship game'}
            </h2>
          </div>

          <button
            onClick={() => (isAdmin ? setIsEditOpen(true) : setIsViewOpen(true))}
            className="mx-auto mt-12 block w-full max-w-2xl rounded-lg border border-hairline bg-surface px-6 py-10 transition-colors hover:bg-surface-hover sm:px-10"
            aria-label={`${homeName} versus ${awayName}${isAdmin ? ', edit' : ', box score'}`}
          >
            <div className="flex items-start justify-center gap-4 sm:gap-10">
              <Side slug={game.homeTeamId} name={homeName} score={game.homeScore} />
              {!played && (
                <span className="pt-[1.6rem] text-[15px] text-ink-tertiary sm:pt-[2.2rem]">
                  vs
                </span>
              )}
              <Side slug={game.awayTeamId} name={awayName} score={game.awayScore} />
            </div>

            <p className="tabular mt-10 text-center text-[13px] text-ink-tertiary">
              {formatDate(game.date)} · {formatTime(game.time)}
              {game.location ? ` · ${game.location}` : ''}
            </p>
          </button>
        </div>
      </section>

      <EditBoxScoreModal
        game={game}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={load}
      />
      <BoxScoreModal
        game={game}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      />
    </>
  )
}
