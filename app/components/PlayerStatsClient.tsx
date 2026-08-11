/**
 * PlayerStatsClient - Client component for player statistics page
 * Displays all players with their aggregated stats, with team filtering and search
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getAllPlayersWithStats } from '@/lib/supabaseData'
import { TEAMS } from '@/config/teams'
import { Search, Filter, Trophy, Target, Users, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useAdmin } from '@/lib/adminContext'
import { AwardVoting } from './AwardVoting'
import { AwardManagement } from './AwardManagement'

interface PlayerStats {
  id: string
  name: string
  jerseyNumber: number
  position: string | null
  team: {
    id: string
    name: string
    slug: string
    logoUrl: string
  } | null
  goals: number
  assists: number
  saves: number
  gamesPlayed: number
  manOfTheMatchCount: number
}

type SortField = 'name' | 'team' | 'goals' | 'assists' | 'saves'
type SortOrder = 'asc' | 'desc'

export function PlayerStatsClient() {
  const { isAdmin } = useAdmin()
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerStats[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true)
      const data = await getAllPlayersWithStats()
      setPlayers(data)
      setFilteredPlayers(data)
      setIsLoading(false)
    }

    fetchPlayers()
  }, [])

  useEffect(() => {
    let filtered = players

    // Filter by team
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(player => player.team?.slug === selectedTeam)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(query) ||
        player.jerseyNumber.toString().includes(query)
      )
    }

    // Sort the filtered results
    filtered = [...filtered].sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'team':
          compareValue = (a.team?.name || '').localeCompare(b.team?.name || '')
          break
        case 'goals':
          compareValue = a.goals - b.goals
          break
        case 'assists':
          compareValue = a.assists - b.assists
          break
        case 'saves':
          compareValue = a.saves - b.saves
          break
      }

      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredPlayers(filtered)
  }, [selectedTeam, searchQuery, players, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="inline ml-1 opacity-50" />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={14} className="inline ml-1" />
      : <ArrowDown size={14} className="inline ml-1" />
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Loading player statistics...</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen pb-12">
      {/* Header */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-[#D47F7D] hover:text-[#B8860B] transition-colors mb-4"
          >
            <ChevronLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-black mb-2">
            Player Statistics
          </h1>
          <p className="text-gray-400">
            View all player stats across the league
          </p>
        </div>
      </section>

      {/* Award Voting Section */}
      <section className="px-4 sm:px-6 mb-8">
        <div className="max-w-7xl mx-auto">
          {isAdmin ? <AwardManagement /> : <AwardVoting />}
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 sm:px-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Search size={16} className="inline mr-2" />
                  Search Player
                </label>
                <input
                  type="text"
                  placeholder="Search by name or jersey number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white placeholder-gray-500 focus:border-[#D47F7D] focus:outline-none"
                />
              </div>

              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Filter size={16} className="inline mr-2" />
                  Filter by Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white focus:border-[#D47F7D] focus:outline-none"
                >
                  <option value="all">All Teams</option>
                  {TEAMS.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-400">
              Showing {filteredPlayers.length} player{filteredPlayers.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Table */}
      <section className="px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {filteredPlayers.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-12 text-center">
              <Users size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">No players found matching your criteria</p>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg overflow-hidden">
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a] border-b border-[#523232]">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#D47F7D] transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Player
                        <SortIcon field="name" />
                      </th>
                      <th 
                        className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#D47F7D] transition-colors"
                        onClick={() => handleSort('team')}
                      >
                        Team
                        <SortIcon field="team" />
                      </th>
                      <th 
                        className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#D47F7D] transition-colors"
                        onClick={() => handleSort('goals')}
                      >
                        <Trophy size={14} className="inline mr-1" />
                        Goals
                        <SortIcon field="goals" />
                      </th>
                      <th 
                        className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#D47F7D] transition-colors"
                        onClick={() => handleSort('assists')}
                      >
                        <Target size={14} className="inline mr-1" />
                        Assists
                        <SortIcon field="assists" />
                      </th>
                      <th 
                        className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-[#D47F7D] transition-colors"
                        onClick={() => handleSort('saves')}
                      >
                        Saves
                        <SortIcon field="saves" />
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#523232]">
                    {filteredPlayers.map((player) => (
                      <tr 
                        key={player.id}
                        className="hover:bg-[#0a0a0a] transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#523232] flex items-center justify-center font-bold text-white flex-shrink-0">
                              #{player.jerseyNumber}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">
                                {player.name}
                              </span>
                              {/* Display Puro logos for Man of The Match awards */}
                              {player.manOfTheMatchCount > 0 && (
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: player.manOfTheMatchCount }).map((_, index) => (
                                    <Image
                                      key={index}
                                      src="/images/puro_white.png"
                                      alt="Man of The Match"
                                      width={36}
                                      height={36}
                                      className="rounded-full"
                                      title={`Man of The Match x${player.manOfTheMatchCount}`}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {player.team && (
                            <div className="flex items-center gap-2">
                              <Image
                                src={
                                  player.team.logoUrl && !player.team.logoUrl.includes('/league_data/')
                                    ? player.team.logoUrl
                                    : `/images/${player.team.slug}_logo.png`
                                }
                                alt={player.team.name}
                                width={24}
                                height={24}
                                className="rounded"
                              />
                              <span className="text-gray-300">{player.team.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-white font-bold">
                          {player.goals}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-white font-bold">
                          {player.assists}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-white font-bold">
                          {player.saves}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-[#523232]">
                {filteredPlayers.map((player) => (
                  <div key={player.id} className="p-4">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#523232] flex items-center justify-center font-bold text-white flex-shrink-0">
                        #{player.jerseyNumber}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-lg">
                            {player.name}
                          </h3>
                          {/* Display Puro logos for Man of The Match awards */}
                          {player.manOfTheMatchCount > 0 && (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: player.manOfTheMatchCount }).map((_, index) => (
                                <Image
                                  key={index}
                                  src="/images/puro_white.png"
                                  alt="Man of The Match"
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                  title={`Man of The Match x${player.manOfTheMatchCount}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        {player.team && (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Image
                              src={
                                player.team.logoUrl && !player.team.logoUrl.includes('/league_data/')
                                  ? player.team.logoUrl
                                  : `/images/${player.team.slug}_logo.png`
                              }
                              alt={player.team.name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            <span>{player.team.name}</span>
                            {player.position && (
                              <>
                                <span>•</span>
                                <span>{player.position}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">GP</div>
                        <div className="text-lg font-bold text-white">{player.gamesPlayed}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Goals</div>
                        <div className="text-lg font-bold text-white">{player.goals}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Assists</div>
                        <div className="text-lg font-bold text-white">{player.assists}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Saves</div>
                        <div className="text-lg font-bold text-white">{player.saves}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

