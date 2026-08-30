/**
 * Team page: roster and fixtures for one team.
 * Route: /teams/[teamId] where teamId is the team slug.
 */

'use client'

import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Team } from '@/types/team'
import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { TeamRoster } from '@/app/components/TeamRoster'
import { getTeamBySlug, getAllGames } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'
import { fallbackTeamLogo } from '@/config/league'

export default function TeamPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const { getTeam } = useTeams()
  const [team, setTeam] = useState<Team | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTeamData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [record, allGames] = await Promise.all([
        getTeamBySlug(teamId),
        getAllGames(),
      ])

      if (!record) {
        setTeam(null)
        return
      }

      const roster: Player[] = (record.players ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        jerseyNumber: p.jersey_number,
        teamId: record.slug,
        position: p.position,
        isActive: p.is_active,
        isCaptain: p.is_captain ?? false,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }))

      setTeam({
        id: record.slug,
        uuid: record.id,
        name: record.name,
        logoUrl: record.logo_url || fallbackTeamLogo(record.slug),
        roster,
        primaryColor: record.primary_color || getTeam(teamId)?.primaryColor,
        // Undefined rather than null or '': the sponsor block is rendered only
        // when a name is present, and most teams start a season unsponsored.
        sponsorName: record.sponsor_name || undefined,
        sponsorLogoUrl: record.sponsor_logo_url || undefined,
        kitImageUrl: record.kit_image_url || undefined,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      })
      setGames(allGames)
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [teamId, getTeam])

  useEffect(() => {
    loadTeamData()

    // Roster edits dispatch this; reload so the page reflects them immediately.
    const handleUpdate = () => loadTeamData()
    window.addEventListener('dataUpdated', handleUpdate)
    return () => window.removeEventListener('dataUpdated', handleUpdate)
  }, [loadTeamData])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 pt-14 sm:px-8 sm:pt-20">
        {/* No spinner: a rotating ring is the one shape this system has no
            room for, and with square corners it degrades into a stray line.
            The label sits at the indent the real content will use. */}
        <p className="loading">Loading team</p>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-ink mb-4">Team Not Found</h1>
          <p className="text-ink-secondary">
            There is no team with the id &quot;{teamId}&quot;.
          </p>
        </div>
      </div>
    )
  }

  return <TeamRoster team={team} games={games} />
}
