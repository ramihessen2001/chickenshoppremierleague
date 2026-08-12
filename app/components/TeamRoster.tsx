/**
 * A team's page: crest and name, then roster and fixtures side by side.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Team } from '@/types/team'
import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { PlayerList } from './PlayerList'
import { TeamSchedule } from './TeamSchedule'
import { EditPlayerModal } from './EditPlayerModal'
import { useAdmin } from '@/lib/adminContext'

interface TeamRosterProps {
  team: Team
  games?: Game[]
}

export function TeamRoster({ team, games = [] }: TeamRosterProps) {
  const { isAdmin } = useAdmin()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const openFor = (player: Player | null) => {
    setSelectedPlayer(player)
    setIsEditModalOpen(true)
  }

  const activeCount = team.roster.filter((p) => p.isActive).length

  return (
    <>
      <header className="border-b border-hairline">
        <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8 sm:pb-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
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

            {isAdmin && (
              <button
                onClick={() => openFor(null)}
                className="inline-flex items-center gap-1.5 rounded-pill bg-surface-inverse px-4 py-2 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85"
              >
                <Plus size={15} />
                Add player
              </button>
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

      <EditPlayerModal
        player={selectedPlayer}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        defaultTeamId={team.id}
      />
    </>
  )
}
