/**
 * Championship Game Card - KNIGHTS vs WARRIORS
 * The EPIC final showdown of the season!
 */

'use client'

import Image from 'next/image'
import { Trophy, Zap, Flame, Crown, Swords, Star, Sparkles, Edit2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAdmin } from '@/lib/adminContext'
import { Game } from '@/types/game'
import { supabase } from '@/lib/supabase'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { BoxScoreModal } from './BoxScoreModal'

export function ChampionshipGameCard() {
  const { isAdmin } = useAdmin()
  const [isHovered, setIsHovered] = useState(false)
  const [championshipGame, setChampionshipGame] = useState<Game | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChampionshipGame()
    
    // Listen for game updates
    const handleDataUpdate = () => {
      loadChampionshipGame()
    }
    
    window.addEventListener('dataUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate)
    }
  }, [])

  const loadChampionshipGame = async () => {
    try {
      setIsLoading(true)
      // Fetch game 104 (championship game)
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          home_team:teams!games_home_team_id_fkey(id, name, slug, logo_url),
          away_team:teams!games_away_team_id_fkey(id, name, slug, logo_url),
          statistics:game_statistics(*)
        `)
        .eq('game_number', 104)
        .single()

      if (error) {
        console.error('Error loading championship game:', error)
        return
      }

      if (data) {
        // Transform to match Game interface
        const game: Game = {
          id: data.id,
          weekNumber: data.week_number,
          date: data.date,
          time: data.time,
          location: data.location,
          homeTeamId: (data.home_team as any)?.slug || '',
          awayTeamId: (data.away_team as any)?.slug || '',
          homeScore: data.home_score,
          awayScore: data.away_score,
          status: data.status,
          statistics: data.statistics || [],
          createdAt: data.created_at || '',
          updatedAt: data.updated_at || ''
        }
        setChampionshipGame(game)
      }
    } catch (error) {
      console.error('Error loading championship game:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardClick = () => {
    if (isAdmin) {
      setIsEditModalOpen(true)
    } else {
      setIsViewModalOpen(true)
    }
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
  }

  const handleSave = () => {
    loadChampionshipGame()
  }

  // Show scores if game is completed
  const hasScores = championshipGame && championshipGame.homeScore !== null && championshipGame.awayScore !== null
  const isCompleted = championshipGame?.status === 'completed'

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white text-xl">Loading epic championship game...</p>
        </div>
      </section>
    )
  }

  if (!championshipGame) {
    return null
  }

  return (
    <>
      <section className="py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Epic Header */}
        <div className="text-center mb-8 relative">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 animate-pulse">
              <Star className="text-yellow-400 opacity-20" size={48} />
            </div>
            <div className="absolute top-0 right-1/4 animate-pulse delay-75">
              <Star className="text-yellow-400 opacity-20" size={48} />
            </div>
            <div className="absolute top-8 left-1/3 animate-bounce">
              <Sparkles className="text-[#D47F7D] opacity-30" size={32} />
            </div>
            <div className="absolute top-8 right-1/3 animate-bounce delay-100">
              <Sparkles className="text-[#D47F7D] opacity-30" size={32} />
            </div>
          </div>

          {/* Epic Title */}
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="text-yellow-400 animate-pulse" size={48} />
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase bg-gradient-to-r from-[#D47F7D] via-yellow-400 to-[#B8860B] bg-clip-text text-transparent animate-pulse">
                CHAMPIONSHIP GAME
              </h2>
              <Trophy className="text-yellow-400 animate-pulse" size={48} />
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="text-orange-500 animate-bounce" size={24} />
              <p className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider">
                🔥 The Final Battle 🔥
              </p>
              <Flame className="text-orange-500 animate-bounce" size={24} />
            </div>
            
            <p className="text-lg sm:text-xl text-[#B8860B] font-semibold italic">
              "Two titans collide. Only one shall reign supreme."
            </p>
          </div>
        </div>

        {/* The Epic Game Card */}
        <div 
          className="relative group cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCardClick}
        >
          {/* Admin Edit Button */}
          {isAdmin && (
            <div className="absolute -top-4 -right-4 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditModalOpen(true)
                }}
                className="bg-[#D47F7D] hover:bg-[#B8860B] text-black p-3 rounded-full shadow-2xl transform transition-all hover:scale-110 border-2 border-yellow-400"
                aria-label="Edit championship game"
              >
                <Edit2 size={24} />
              </button>
            </div>
          )}

          {/* Game Status Badge */}
          {isCompleted && hasScores && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
              <div className="bg-green-600 text-white px-6 py-2 rounded-full border-2 border-green-400 shadow-xl font-black uppercase text-sm">
                ✅ FINAL SCORE: {championshipGame.homeScore} - {championshipGame.awayScore}
              </div>
            </div>
          )}
          
          {/* Glowing Border Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D47F7D] via-yellow-400 to-[#B8860B] rounded-2xl blur opacity-75 group-hover:opacity-100 animate-pulse"></div>
          
          {/* Main Card */}
          <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-4 border-[#D47F7D] rounded-2xl p-8 shadow-2xl transform transition-all duration-300 hover:scale-105">
            
            {/* Top Banner */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
            
            {/* Championship Belt Icon */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 p-4 rounded-full border-4 border-yellow-200 shadow-2xl">
                  <Crown className="text-yellow-900" size={40} />
                </div>
              </div>
            </div>

            {/* Teams Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center mt-8">
              
              {/* KNIGHTS - Left Side */}
              <div className="text-center md:text-right space-y-4">
                <div className="relative inline-block">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-[#523232] rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  
                  {/* Team Logo */}
                  <div className="relative">
                    <Image
                      src="/images/knights_logo.png"
                      alt="Knights"
                      width={180}
                      height={180}
                      className="rounded-full border-4 border-[#523232] shadow-2xl transform transition-transform group-hover:scale-110 group-hover:rotate-3"
                    />
                    {/* Corner Decorations */}
                    <Swords className="absolute -top-4 -left-4 text-[#523232] animate-pulse" size={32} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black uppercase text-white mb-2 tracking-wider">
                    KNIGHTS
                  </h3>
                  <div className="flex items-center justify-center md:justify-end gap-2">
                    <Crown className="text-[#523232]" size={20} />
                    <p className="text-lg font-bold text-[#523232] uppercase">
                      The Dark Riders
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 italic mt-2">
                    "Honor. Courage. Victory."
                  </p>
                </div>
              </div>

              {/* VS - Center */}
              <div className="text-center relative">
                {/* Animated Lightning */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className={`text-yellow-400 ${isHovered ? 'animate-ping' : 'animate-pulse'}`} size={100} style={{ opacity: 0.2 }} />
                </div>
                
                {/* VS Badge */}
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#D47F7D] to-yellow-400 rounded-full blur-xl opacity-75 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-[#D47F7D] via-yellow-400 to-[#B8860B] p-8 rounded-full border-4 border-white shadow-2xl transform transition-transform hover:rotate-180 duration-500">
                    <p className="text-5xl sm:text-6xl font-black text-black">VS</p>
                  </div>
                </div>
                
                {/* Game Details */}
                <div className="mt-6 space-y-2">
                  <div className="inline-block px-6 py-2 bg-gradient-to-r from-[#D47F7D] to-[#B8860B] rounded-full border-2 border-yellow-400 shadow-lg">
                    <p className="text-lg font-bold text-black uppercase tracking-wider">
                      ⚽ FINAL GAME ⚽
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-white">
                      TODAY • {championshipGame.time.toUpperCase()}
                    </p>
                    <p className="text-lg text-[#B8860B] font-semibold">
                      📍 {championshipGame.location.toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-400 italic">
                      (aka The Battleground)
                    </p>
                  </div>
                  
                  {/* Hype Badges */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
                      🔴 LIVE
                    </span>
                    <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                      ⭐ MUST WATCH
                    </span>
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                      👑 EPIC
                    </span>
                  </div>
                </div>
              </div>

              {/* WARRIORS - Right Side */}
              <div className="text-center md:text-left space-y-4">
                <div className="relative inline-block">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-[#8B0000] rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  
                  {/* Team Logo */}
                  <div className="relative">
                    <Image
                      src="/images/warriors_logo.png"
                      alt="Warriors"
                      width={180}
                      height={180}
                      className="rounded-full border-4 border-[#8B0000] shadow-2xl transform transition-transform group-hover:scale-110 group-hover:-rotate-3"
                    />
                    {/* Corner Decorations */}
                    <Flame className="absolute -top-4 -right-4 text-[#8B0000] animate-bounce" size={32} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black uppercase text-white mb-2 tracking-wider">
                    WARRIORS
                  </h3>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Flame className="text-[#8B0000]" size={20} />
                    <p className="text-lg font-bold text-[#8B0000] uppercase">
                      The Crimson Crusaders
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 italic mt-2">
                    "Strength. Honor. Glory."
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Epic Text */}
            <div className="mt-8 text-center space-y-4">
              <div className="h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
              
              <div className="space-y-2">
                <p className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                  🏆 The Final Showdown for Ultimate Glory! 🏆
                </p>
                <p className="text-lg text-[#D47F7D] font-bold italic">
                  "Legends will be made. History will be written."
                </p>
                <p className="text-base text-gray-400">
                  Two warriors enter. One champion emerges. The crown awaits the victor.
                </p>
              </div>

              {/* Hype Meter */}
              <div className="max-w-md mx-auto mt-6">
                <p className="text-sm text-gray-400 mb-2 uppercase font-semibold">Hype Level:</p>
                <div className="h-8 bg-[#0a0a0a] rounded-full border-2 border-[#D47F7D] overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-green-500 rounded-full animate-pulse flex items-center justify-center">
                    <p className="text-xs font-black text-black uppercase tracking-wider">
                      🔥 MAXIMUM HYPE! 🔥
                    </p>
                  </div>
                </div>
              </div>

              {/* Call to Action */}
              <div className="mt-6">
                <button className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D47F7D] via-yellow-400 to-[#B8860B] rounded-full text-black font-black text-lg uppercase tracking-wider shadow-2xl transform transition-all hover:scale-110 hover:shadow-yellow-400/50">
                  <Sparkles className="animate-spin" size={24} />
                  <span>Don't Miss This Epic Battle!</span>
                  <Sparkles className="animate-spin" size={24} />
                </button>
              </div>
            </div>

            {/* Decorative Corner Elements */}
            <div className="absolute top-4 left-4 opacity-30">
              <Star className="text-yellow-400 animate-pulse" size={32} />
            </div>
            <div className="absolute top-4 right-4 opacity-30">
              <Star className="text-yellow-400 animate-pulse" size={32} />
            </div>
            <div className="absolute bottom-4 left-4 opacity-30">
              <Zap className="text-[#D47F7D] animate-pulse" size={32} />
            </div>
            <div className="absolute bottom-4 right-4 opacity-30">
              <Zap className="text-[#D47F7D] animate-pulse" size={32} />
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-3xl font-black text-white uppercase tracking-wider animate-pulse">
            ⚔️ The Battle of the Century ⚔️
          </p>
          <p className="text-xl text-[#B8860B] font-bold italic">
            "When legends clash, only greatness remains"
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Trophy className="text-yellow-400" size={32} />
            <p className="text-lg text-gray-400 font-semibold">
              Winner Takes All • Loser Takes Nothing
            </p>
            <Trophy className="text-yellow-400" size={32} />
          </div>
        </div>
      </div>
    </section>

    {/* Edit Modal - Admin only */}
    <EditBoxScoreModal
      game={championshipGame}
      isOpen={isEditModalOpen}
      onClose={handleCloseEditModal}
      onSave={handleSave}
    />

    {/* View Modal - Public */}
    <BoxScoreModal
      game={championshipGame}
      isOpen={isViewModalOpen}
      onClose={handleCloseViewModal}
    />
  </>
  )
}

