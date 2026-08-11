/**
 * Team Roster Page - Dynamic route for individual team rosters
 * Route: /teams/[teamId]
 */

'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Team } from '@/types/team'
import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { TeamRoster } from '@/app/components/TeamRoster'
import { getTeamBySlug, getAllGames } from '@/lib/supabaseData'
import { TEAMS } from '@/config/teams'

export default function TeamPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const [team, setTeam] = useState<Team | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadTeamData() {
      try {
        // Fetch team data from Supabase using slug (same as teamId)
        const supabaseTeam = await getTeamBySlug(teamId)
        
        if (!supabaseTeam) {
          setIsLoading(false)
          return
        }
        
        // Get logo URL from local config as fallback
        // If Supabase has the wrong path (/league_data/...), use local config instead
        const localTeamConfig = TEAMS.find(t => t.id === teamId)
        const supabaseLogoUrl = supabaseTeam.logo_url
        
        // Use Supabase logo_url only if it's NOT the old /league_data/ path
        const logoUrl = (supabaseLogoUrl && !supabaseLogoUrl.includes('/league_data/'))
          ? supabaseLogoUrl
          : localTeamConfig?.logoUrl || `/images/${teamId}_logo.png`
        
        // Transform Supabase team to local Team type
        const roster: Player[] = supabaseTeam.players.map((p: any) => ({
          id: p.id,
          name: p.name,
          jerseyNumber: p.jersey_number,
          teamId: supabaseTeam.slug,
          position: p.position,
          isActive: p.is_active,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }))
        
        const teamData: Team = {
          id: supabaseTeam.slug,
          name: supabaseTeam.name,
          logoUrl: logoUrl,
          roster,
          primaryColor: localTeamConfig?.primaryColor || '#2686DF',
          createdAt: supabaseTeam.created_at,
          updatedAt: supabaseTeam.updated_at
        }
        
        // Fetch all games from Supabase
        const allGames = await getAllGames()
        
        setTeam(teamData)
        setGames(allGames)
      } catch (error) {
        console.error('Error loading team data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadTeamData()
  }, [teamId])
  
  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2686DF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading team...</p>
        </div>
      </div>
    )
  }
  
  if (!team) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Team Not Found</h1>
          <p className="text-gray-400">The team you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }
  
  return <TeamRoster team={team} games={games} />
}



