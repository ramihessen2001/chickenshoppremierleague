/**
 * TeamRoster component for YM JAX Soccer League
 * Displays team information and complete roster
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Team } from '@/types/team'
import { Game } from '@/types/game'
import { PlayerList } from './PlayerList'
import { TeamSchedule } from './TeamSchedule'
import { EditPlayerModal } from './EditPlayerModal'
import { useAdmin } from '@/lib/adminContext'
import { ArrowLeft, Plus } from 'lucide-react'
import { Player } from '@/types/player'

interface TeamRosterProps {
  team: Team
  games?: Game[]
}

export function TeamRoster({ team, games = [] }: TeamRosterProps) {
  const { isAdmin } = useAdmin()
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const handleAddPlayer = () => {
    setSelectedPlayer(null)
    setIsEditModalOpen(true)
  }
  
  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player)
    setIsEditModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setTimeout(() => setSelectedPlayer(null), 200)
  }
  
  return (
    <>
      <div className="w-full py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#D47F7D] hover:text-[#D47F7D]/80 transition-colors mb-8"
            aria-label="Back to homepage"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Back to Home</span>
          </Link>
          
          {/* Team header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-12">
            <div className="relative w-42 h-42 sm:w-52 sm:h-52">
              <Image
                src={team.logoUrl}
                alt={`${team.name} logo`}
                fill
                sizes="(max-width: 768px) 168px, 208px"
                className="object-contain"
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
                {team.name.toUpperCase()}
              </h1>
              <p className="text-xl text-gray-400">
                {team.roster.length} {team.roster.length === 1 ? 'Player' : 'Players'}
              </p>
            </div>
            
            {isAdmin && (
              <button
                onClick={handleAddPlayer}
                className="flex items-center gap-2 px-4 py-2 bg-[#D47F7D] text-white rounded hover:bg-[#c66f6d] transition-colors font-semibold"
              >
                <Plus size={18} />
                Add Player
              </button>
            )}
          </div>
          
          {/* Gold divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mb-8" />
          
          {/* Two column layout for larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left column: Roster */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6 text-[#D47F7D]">
                Team Roster
              </h2>
              
              <PlayerList 
                players={team.roster} 
                onEditPlayer={isAdmin ? handleEditPlayer : undefined}
              />
            </div>
            
            {/* Right column: Schedule */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold uppercase mb-6 text-[#2686DF]">
                Team Schedule
              </h2>
              
              <TeamSchedule teamId={team.id} games={games} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Player Modal */}
      <EditPlayerModal 
        player={selectedPlayer} 
        isOpen={isEditModalOpen} 
        onClose={handleCloseModal}
        defaultTeamId={team.id}
      />
    </>
  )
}

