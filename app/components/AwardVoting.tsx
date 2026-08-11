/**
 * Award Voting Component
 * Public interface for users to vote on award nominees
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Trophy, CheckCircle, Circle } from 'lucide-react'
import { getAwardsWithNominees, submitVote, AwardWithNominees } from '@/lib/supabaseAwards'

export function AwardVoting() {
  const [awards, setAwards] = useState<AwardWithNominees[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [voterIdentifier, setVoterIdentifier] = useState('')
  const [voterName, setVoterName] = useState('')
  const [selectedNominees, setSelectedNominees] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [pendingVote, setPendingVote] = useState<{ awardId: string; nomineeId: string } | null>(null)

  useEffect(() => {
    // Generate a unique voter identifier (using a combination of timestamp and random)
    // In production, you might want to use IP address or a more sophisticated method
    const identifier = localStorage.getItem('voter_id') || `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('voter_id', identifier)
    setVoterIdentifier(identifier)

    // Check if voter name is already saved
    const savedName = localStorage.getItem('voter_name')
    if (savedName) {
      setVoterName(savedName)
    }

    fetchAwards(identifier)
  }, [])

  const fetchAwards = async (identifier: string) => {
    setIsLoading(true)
    const data = await getAwardsWithNominees(identifier)
    setAwards(data)
    setIsLoading(false)
  }

  const handleSelectNominee = (awardId: string, nomineeId: string) => {
    setSelectedNominees({
      ...selectedNominees,
      [awardId]: nomineeId
    })
  }

  const handleSubmitVote = async (awardId: string) => {
    const nomineeId = selectedNominees[awardId]
    if (!nomineeId) {
      alert('Please select a nominee before voting')
      return
    }

    // If no name is saved, prompt for it
    if (!voterName) {
      setPendingVote({ awardId, nomineeId })
      setShowNamePrompt(true)
      return
    }

    await submitVoteWithName(awardId, nomineeId, voterName)
  }

  const submitVoteWithName = async (awardId: string, nomineeId: string, name: string) => {
    setIsSubmitting(true)

    // submitVote returns null on success, or a message explaining the refusal
    // (already voted, voting closed, and so on).
    const failure = await submitVote(awardId, nomineeId, voterIdentifier, name)

    if (failure === null) {
      localStorage.setItem('voter_name', name)
      setVoterName(name)

      await fetchAwards(voterIdentifier)

      const newSelections = { ...selectedNominees }
      delete newSelections[awardId]
      setSelectedNominees(newSelections)
      alert('Vote submitted. Thanks!')
    } else {
      alert(failure)
    }

    setIsSubmitting(false)
    setShowNamePrompt(false)
    setPendingVote(null)
  }

  const handleNameSubmit = () => {
    if (!voterName.trim()) {
      alert('Please enter your name')
      return
    }

    if (pendingVote) {
      submitVoteWithName(pendingVote.awardId, pendingVote.nomineeId, voterName)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading awards...</p>
      </div>
    )
  }

  if (awards.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-12 text-center">
        <Trophy size={48} className="mx-auto text-gray-500 mb-4" />
        <p className="text-gray-400">No active awards at this time</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Award Voting</h2>
            <p className="text-gray-400">Vote for your favorite players in each category</p>
          </div>
          {voterName && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Voting as:</p>
              <p className="text-white font-semibold">{voterName}</p>
            </div>
          )}
        </div>
      </div>

      {/* Awards */}
      <div className="space-y-6">
        {awards.map(award => (
          <div
            key={award.id}
            className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6"
          >
            {/* Award Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Trophy size={24} className="text-[#D47F7D]" />
                  <h3 className="text-xl font-bold text-white">{award.name}</h3>
                  {award.userHasVoted && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 flex items-center gap-1">
                      <CheckCircle size={14} />
                      Voted
                    </span>
                  )}
                </div>
                {award.description && (
                  <p className="text-gray-400 mb-2">{award.description}</p>
                )}
                <p className="text-sm text-gray-500">
                  {award.totalVotes} {award.totalVotes === 1 ? 'vote' : 'votes'} cast
                </p>
              </div>
            </div>

            {/* Nominees */}
            {award.nominees.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No nominees yet</p>
            ) : award.userHasVoted ? (
              <div className="space-y-3">
                {award.nominees.map(nominee => (
                  <div
                    key={nominee.id}
                    className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#523232] rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#523232] flex items-center justify-center font-bold text-white flex-shrink-0">
                        #{nominee.player.jersey_number}
                      </div>
                      <div>
                        <div className="font-semibold text-white">
                          {nominee.player.name}
                        </div>
                        {nominee.player.team && (
                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <Image
                              src={
                                nominee.player.team.logoUrl && !nominee.player.team.logoUrl.includes('/league_data/')
                                  ? nominee.player.team.logoUrl
                                  : `/images/${nominee.player.team.slug}_logo.png`
                              }
                              alt={nominee.player.team.name}
                              width={16}
                              height={16}
                              className="rounded"
                            />
                            <span>{nominee.player.team.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <p className="text-center text-sm text-gray-500 mt-4">
                  You have already voted for this award
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {award.nominees.map(nominee => {
                  const isSelected = selectedNominees[award.id] === nominee.id
                  
                  return (
                    <button
                      key={nominee.id}
                      onClick={() => handleSelectNominee(award.id, nominee.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                        isSelected
                          ? 'bg-[#D47F7D]/20 border-2 border-[#D47F7D]'
                          : 'bg-[#0a0a0a] border border-[#523232] hover:border-[#D47F7D]'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#523232] flex items-center justify-center font-bold text-white flex-shrink-0">
                          #{nominee.player.jersey_number}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-white">
                            {nominee.player.name}
                          </div>
                          {nominee.player.team && (
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                              <Image
                                src={
                                  nominee.player.team.logoUrl && !nominee.player.team.logoUrl.includes('/league_data/')
                                    ? nominee.player.team.logoUrl
                                    : `/images/${nominee.player.team.slug}_logo.png`
                                }
                                alt={nominee.player.team.name}
                                width={16}
                                height={16}
                                className="rounded"
                              />
                              <span>{nominee.player.team.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckCircle size={24} className="text-[#D47F7D] flex-shrink-0" />
                      ) : (
                        <Circle size={24} className="text-gray-500 flex-shrink-0" />
                      )}
                    </button>
                  )
                })}

                {/* Vote Button */}
                {selectedNominees[award.id] && (
                  <button
                    onClick={() => handleSubmitVote(award.id)}
                    disabled={isSubmitting}
                    className="w-full mt-4 px-6 py-3 bg-[#D47F7D] text-white font-semibold rounded-lg hover:bg-[#B8860B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Name Prompt Modal */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6 max-w-md w-full">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-2">Enter Your Name</h3>
              <p className="text-gray-400 text-sm">
                Please enter your name to complete your vote. This will be saved for future votes.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white placeholder-gray-500 focus:border-[#D47F7D] focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleNameSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#D47F7D] text-white rounded-lg hover:bg-[#B8860B] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Vote'}
                </button>
                <button
                  onClick={() => {
                    setShowNamePrompt(false)
                    setPendingVote(null)
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-[#0a0a0a] border border-[#523232] text-white rounded-lg hover:border-[#D47F7D] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


