/**
 * Award Management Component
 * Admin interface for creating and managing awards and nominees
 */

'use client'

import { useState, useEffect } from 'react'
import { Trophy, Plus, X, Users, Edit2, Trash2, Check } from 'lucide-react'
import { Award } from '@/lib/supabase'
import { 
  getAllAwards, 
  createAward, 
  updateAward, 
  deleteAward,
  addNominee,
  removeNominee,
  getAwardVoteResults
} from '@/lib/supabaseAwards'
import { getAllPlayersWithStats } from '@/lib/supabaseData'

interface PlayerStats {
  id: string
  name: string
  jerseyNumber: number
  team: {
    id: string
    name: string
    slug: string
    logoUrl: string
  } | null
}

export function AwardManagement() {
  const [awards, setAwards] = useState<Award[]>([])
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showNomineeModal, setShowNomineeModal] = useState(false)
  const [showVoteResultsModal, setShowVoteResultsModal] = useState(false)
  const [selectedAward, setSelectedAward] = useState<Award | null>(null)
  const [voteResults, setVoteResults] = useState<Array<{
    nomineeId: string
    playerName: string
    voteCount: number
    voterNames: string[]
  }>>([])

  // Form state for creating/editing awards
  const [awardForm, setAwardForm] = useState({
    name: '',
    description: '',
    season: '2025 Winter',
    is_active: true
  })

  // State for managing nominees
  const [nominees, setNominees] = useState<Array<{
    id: string
    player_id: string
    playerName: string
  }>>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const [awardsData, playersData] = await Promise.all([
      getAllAwards(),
      getAllPlayersWithStats()
    ])
    setAwards(awardsData)
    setPlayers(playersData)
    setIsLoading(false)
  }

  const handleCreateAward = async () => {
    if (!awardForm.name.trim()) {
      alert('Please enter an award name')
      return
    }

    const newAward = await createAward(awardForm)
    if (newAward) {
      setAwards([newAward, ...awards])
      setShowCreateModal(false)
      setAwardForm({
        name: '',
        description: '',
        season: '2025 Winter',
        is_active: true
      })
      alert('Award created successfully!')
    } else {
      alert('Failed to create award')
    }
  }

  const handleToggleActive = async (award: Award) => {
    const updated = await updateAward(award.id, { is_active: !award.is_active })
    if (updated) {
      setAwards(awards.map(a => a.id === award.id ? updated : a))
    }
  }

  const handleDeleteAward = async (awardId: string) => {
    if (!confirm('Are you sure you want to delete this award? This will also delete all nominees and votes.')) {
      return
    }

    const success = await deleteAward(awardId)
    if (success) {
      setAwards(awards.filter(a => a.id !== awardId))
      alert('Award deleted successfully!')
    } else {
      alert('Failed to delete award')
    }
  }

  const handleManageNominees = async (award: Award) => {
    setSelectedAward(award)
    
    // Fetch current nominees for this award
    const { data } = await (await import('@/lib/supabase')).supabase
      .from('award_nominees')
      .select(`
        id,
        player_id,
        players (
          name
        )
      `)
      .eq('award_id', award.id)

    const nomineesData = data?.map(n => ({
      id: n.id,
      player_id: n.player_id,
      playerName: (n.players as any)?.name || ''
    })) || []

    setNominees(nomineesData)
    setShowNomineeModal(true)
  }

  const handleAddNominee = async () => {
    if (!selectedAward || !selectedPlayerId) {
      alert('Please select a player')
      return
    }

    // Check if player is already nominated
    if (nominees.some(n => n.player_id === selectedPlayerId)) {
      alert('This player is already nominated for this award')
      return
    }

    const nominee = await addNominee(selectedAward.id, selectedPlayerId)
    if (nominee) {
      const player = players.find(p => p.id === selectedPlayerId)
      setNominees([...nominees, {
        id: nominee.id,
        player_id: selectedPlayerId,
        playerName: player?.name || ''
      }])
      setSelectedPlayerId('')
      alert('Nominee added successfully!')
    } else {
      alert('Failed to add nominee')
    }
  }

  const handleRemoveNominee = async (nomineeId: string) => {
    if (!confirm('Are you sure you want to remove this nominee?')) {
      return
    }

    const success = await removeNominee(nomineeId)
    if (success) {
      setNominees(nominees.filter(n => n.id !== nomineeId))
      alert('Nominee removed successfully!')
    } else {
      alert('Failed to remove nominee')
    }
  }

  const handleViewVoteResults = async (award: Award) => {
    setSelectedAward(award)
    const results = await getAwardVoteResults(award.id)
    setVoteResults(results)
    setShowVoteResultsModal(true)
  }

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading awards...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Award Management</h2>
          <p className="text-gray-400">Create awards and manage nominees</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#D47F7D] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
        >
          <Plus size={20} />
          Create Award
        </button>
      </div>

      {/* Awards List */}
      <div className="space-y-4">
        {awards.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-12 text-center">
            <Trophy size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No awards created yet</p>
          </div>
        ) : (
          awards.map(award => (
            <div
              key={award.id}
              className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy size={24} className="text-[#D47F7D]" />
                    <h3 className="text-xl font-bold text-white">{award.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      award.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {award.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {award.description && (
                    <p className="text-gray-400 mb-2">{award.description}</p>
                  )}
                  <p className="text-sm text-gray-500">Season: {award.season}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(award)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title={award.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteAward(award.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete Award"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleManageNominees(award)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#523232] text-white rounded-lg hover:border-[#D47F7D] transition-colors"
                >
                  <Users size={16} />
                  Manage Nominees
                </button>
                <button
                  onClick={() => handleViewVoteResults(award)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#523232] text-white rounded-lg hover:border-[#D47F7D] transition-colors"
                >
                  <Trophy size={16} />
                  View Results
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Award Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create New Award</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Award Name *
                </label>
                <input
                  type="text"
                  value={awardForm.name}
                  onChange={(e) => setAwardForm({ ...awardForm, name: e.target.value })}
                  placeholder="e.g., MVP, Golden Boot, Best Goalkeeper"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white placeholder-gray-500 focus:border-[#D47F7D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={awardForm.description}
                  onChange={(e) => setAwardForm({ ...awardForm, description: e.target.value })}
                  placeholder="Optional description of the award"
                  rows={3}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white placeholder-gray-500 focus:border-[#D47F7D] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Season
                </label>
                <input
                  type="text"
                  value={awardForm.season}
                  onChange={(e) => setAwardForm({ ...awardForm, season: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white focus:border-[#D47F7D] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={awardForm.is_active}
                  onChange={(e) => setAwardForm({ ...awardForm, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm text-gray-300">
                  Active (users can vote)
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateAward}
                  className="flex-1 px-4 py-2 bg-[#D47F7D] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  Create Award
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#523232] text-white rounded-lg hover:border-[#D47F7D] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Nominees Modal */}
      {showNomineeModal && selectedAward && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Manage Nominees - {selectedAward.name}
              </h3>
              <button
                onClick={() => setShowNomineeModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Add Nominee */}
            <div className="mb-6 p-4 bg-[#0a0a0a] border border-[#523232] rounded-lg">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">Add Nominee</h4>
              <div className="flex gap-2">
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-[#523232] rounded-lg text-white focus:border-[#D47F7D] focus:outline-none"
                >
                  <option value="">Select a player...</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      #{player.jerseyNumber} {player.name} ({player.team?.name || 'No Team'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddNominee}
                  className="px-4 py-2 bg-[#D47F7D] text-white rounded-lg hover:bg-[#B8860B] transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Current Nominees */}
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">
                Current Nominees ({nominees.length})
              </h4>
              {nominees.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No nominees yet</p>
              ) : (
                <div className="space-y-2">
                  {nominees.map(nominee => (
                    <div
                      key={nominee.id}
                      className="flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#523232] rounded-lg"
                    >
                      <span className="text-white">{nominee.playerName}</span>
                      <button
                        onClick={() => handleRemoveNominee(nominee.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowNomineeModal(false)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] text-white rounded-lg hover:border-[#D47F7D] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vote Results Modal */}
      {showVoteResultsModal && selectedAward && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Vote Results - {selectedAward.name}
              </h3>
              <button
                onClick={() => setShowVoteResultsModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {voteResults.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No votes yet</p>
              ) : (
                voteResults.map((result, index) => (
                  <div
                    key={result.nomineeId}
                    className="p-4 bg-[#0a0a0a] border border-[#523232] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#D47F7D]">
                          #{index + 1}
                        </span>
                        <span className="text-white font-semibold text-lg">
                          {result.playerName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {result.voteCount}
                        </div>
                        <div className="text-xs text-gray-400">
                          {result.voteCount === 1 ? 'vote' : 'votes'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Voter Names */}
                    {result.voterNames.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#523232]">
                        <p className="text-xs text-gray-400 mb-2">Voted by:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.voterNames.map((name, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-[#1a1a1a] border border-[#523232] rounded text-xs text-gray-300"
                            >
                              {name}
                            </span>
                          ))}
                          {result.voteCount > result.voterNames.length && (
                            <span className="px-2 py-1 bg-[#1a1a1a] border border-[#523232] rounded text-xs text-gray-500 italic">
                              +{result.voteCount - result.voterNames.length} anonymous
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowVoteResultsModal(false)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] text-white rounded-lg hover:border-[#D47F7D] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


