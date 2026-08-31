/**
 * A team's page: crest and name, then roster and fixtures side by side.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, ArrowLeftRight } from 'lucide-react'
import { Team } from '@/types/team'
import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { PlayerList } from './PlayerList'
import { buttonPrimary, buttonSecondary } from './Modal'
import { TeamSchedule } from './TeamSchedule'
import { TeamIdentity } from './TeamIdentity'
import { EditPlayerModal } from './EditPlayerModal'
import { TradePanel } from './TradePanel'
import { useAdmin } from '@/lib/adminContext'
import { usePhase } from '@/lib/usePhase'

interface TeamRosterProps {
  team: Team
  games?: Game[]
}

export function TeamRoster({ team, games = [] }: TeamRosterProps) {
  const { isAdmin } = useAdmin()
  const phase = usePhase()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isTradeOpen, setIsTradeOpen] = useState(false)

  // Trades belong to the season: before it there is nothing settled to trade,
  // and the draft has its own way of moving players onto a club.
  const canTrade = isAdmin && (phase === 'season' || phase === 'playoffs')

  const openFor = (player: Player | null) => {
    setSelectedPlayer(player)
    setIsEditModalOpen(true)
  }

  const activeCount = team.roster.filter((p) => p.isActive).length

  return (
    <>
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-10 sm:px-8 sm:pt-20 sm:pb-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex min-w-0 flex-wrap items-center gap-x-8 gap-y-5">
              <div className="flex min-w-0 items-center gap-5">
                <Image
                  src={team.logoUrl}
                  alt=""
                  width={72}
                  height={72}
                  className="h-16 w-16 shrink-0 object-contain sm:h-[72px] sm:w-[72px]"
                  priority
                />
                <div className="min-w-0">
                  <h1 className="truncate text-[2rem] font-semibold text-ink sm:text-[2.75rem]">
                    {team.name}
                  </h1>
                  <p className="tabular mt-1.5 text-[15px] text-ink-secondary">
                    {activeCount} {activeCount === 1 ? 'player' : 'players'}
                  </p>
                </div>
              </div>

              <TeamIdentity team={team} />
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                {canTrade && (
                  <button
                    onClick={() => setIsTradeOpen(true)}
                    className={`${buttonSecondary} gap-1.5`}
                  >
                    <ArrowLeftRight size={15} />
                    Trade
                  </button>
                )}
                <button onClick={() => openFor(null)} className={`${buttonPrimary} gap-1.5`}>
                  <Plus size={15} />
                  Add player
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_22rem] lg:gap-16">
          <section aria-labelledby="roster-heading">
            <h2 id="roster-heading" className="eyebrow">
              Roster
            </h2>
            <div className="mt-5">
              <PlayerList
                players={team.roster}
                onEditPlayer={isAdmin ? openFor : undefined}
              />
            </div>
          </section>

          <section aria-labelledby="team-schedule-heading">
            <h2 id="team-schedule-heading" className="eyebrow">
              Fixtures
            </h2>
            <div className="mt-5">
              <TeamSchedule teamId={team.id} games={games} />
            </div>
          </section>
        </div>
      </div>

      <TradePanel
        isOpen={isTradeOpen}
        onClose={() => setIsTradeOpen(false)}
        defaultTeamId={team.uuid}
      />

      <EditPlayerModal
        player={selectedPlayer}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        defaultTeamId={team.id}
      />
    </>
  )
}
