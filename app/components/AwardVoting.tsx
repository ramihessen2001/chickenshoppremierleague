/**
 * Public award voting.
 *
 * One vote per award per browser, enforced by a unique constraint in the
 * database rather than by a check in the client.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Check } from 'lucide-react'
import {
  getAwardsWithNominees,
  submitVote,
  AwardWithNominees,
} from '@/lib/supabaseAwards'
import { fallbackTeamLogo } from '@/config/league'
import { displayJersey } from '@/types/player'
import {
  Modal,
  FormError,
  fieldClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

export function AwardVoting() {
  const [awards, setAwards] = useState<AwardWithNominees[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [voterIdentifier, setVoterIdentifier] = useState('')
  const [voterName, setVoterName] = useState('')
  const [selectedNominees, setSelectedNominees] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [pendingVote, setPendingVote] = useState<{
    awardId: string
    nomineeId: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchAwards = useCallback(async (identifier: string) => {
    setIsLoading(true)
    setAwards(await getAwardsWithNominees(identifier))
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // A per-browser id, so a voter is not asked to vote twice on one device.
    // It is not proof of identity -- clearing site data resets it.
    const identifier =
      localStorage.getItem('voter_id') ||
      `voter_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem('voter_id', identifier)

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVoterIdentifier(identifier)

    const savedName = localStorage.getItem('voter_name')
    if (savedName) setVoterName(savedName)

    fetchAwards(identifier)
  }, [fetchAwards])

  const handleSubmitVote = async (awardId: string) => {
    const nomineeId = selectedNominees[awardId]
    if (!nomineeId) return

    if (!voterName) {
      setPendingVote({ awardId, nomineeId })
      setShowNamePrompt(true)
      return
    }

    await castVote(awardId, nomineeId, voterName)
  }

  const castVote = async (awardId: string, nomineeId: string, name: string) => {
    setIsSubmitting(true)
    setError(null)

    // Returns null on success, or a message explaining the refusal.
    const failure = await submitVote(awardId, nomineeId, voterIdentifier, name)

    if (failure === null) {
      localStorage.setItem('voter_name', name)
      setVoterName(name)
      await fetchAwards(voterIdentifier)
      setSelectedNominees((current) => {
        const next = { ...current }
        delete next[awardId]
        return next
      })
      setShowNamePrompt(false)
      setPendingVote(null)
    } else {
      setError(failure)
    }

    setIsSubmitting(false)
  }

  const handleNameSubmit = () => {
    if (!voterName.trim()) {
      setError('Please enter your name')
      return
    }
    if (pendingVote) {
      castVote(pendingVote.awardId, pendingVote.nomineeId, voterName.trim())
    }
  }

  if (isLoading) {
    return <p className="text-[15px] text-ink-tertiary">Loading awards…</p>
  }

  if (awards.length === 0) return null

  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-ink">Awards</h2>
          <p className="mt-1.5 text-[14px] text-ink-secondary">
            One vote per award.
          </p>
        </div>
        {voterName && (
          <p className="shrink-0 text-[13px] text-ink-tertiary">
            Voting as <span className="text-ink">{voterName}</span>
          </p>
        )}
      </div>

      {error && !showNamePrompt && (
        <p
          className="mt-5 rounded-md border border-hairline bg-negative-wash px-3.5 py-2.5 text-[13px] text-negative"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {awards.map((award) => {
          const selected = selectedNominees[award.id]

          return (
            <div
              key={award.id}
              className="rounded-lg border border-hairline bg-surface p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[17px] font-semibold text-ink">{award.name}</h3>
                {award.userHasVoted ? (
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-positive">
                    <Check size={13} />
                    Voted
                  </span>
                ) : (
                  <span className="tabular text-[12px] text-ink-tertiary">
                    {award.totalVotes} {award.totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                )}
              </div>

              {award.description && (
                <p className="mt-1.5 text-[14px] text-ink-secondary">
                  {award.description}
                </p>
              )}

              {award.nominees.length === 0 ? (
                <p className="mt-5 text-[14px] text-ink-tertiary">No nominees yet</p>
              ) : (
                <>
                  <ul className="mt-5 space-y-2">
                    {award.nominees.map((nominee) => {
                      const isSelected = selected === nominee.id
                      const team = nominee.player.team

                      const inner = (
                        <>
                          <span className="tabular w-7 shrink-0 text-[13px] text-ink-tertiary">
                            {displayJersey(nominee.player.jersey_number)}
                          </span>
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-[14px] font-medium text-ink">
                              {nominee.player.name}
                            </span>
                            {team?.name && (
                              <span className="mt-0.5 flex items-center gap-1.5">
                                <Image
                                  src={team.logoUrl || fallbackTeamLogo(team.slug)}
                                  alt=""
                                  width={14}
                                  height={14}
                                  className="h-3.5 w-3.5 shrink-0 object-contain"
                                />
                                <span className="truncate text-[12px] text-ink-tertiary">
                                  {team.name}
                                </span>
                              </span>
                            )}
                          </span>
                        </>
                      )

                      if (award.userHasVoted) {
                        return (
                          <li
                            key={nominee.id}
                            className="flex items-center gap-3 rounded-md border border-hairline px-4 py-3"
                          >
                            {inner}
                            <span className="tabular shrink-0 text-[13px] text-ink-tertiary">
                              {nominee.voteCount}
                            </span>
                          </li>
                        )
                      }

                      return (
                        <li key={nominee.id}>
                          <button
                            onClick={() =>
                              setSelectedNominees((current) => ({
                                ...current,
                                [award.id]: nominee.id,
                              }))
                            }
                            aria-pressed={isSelected}
                            className={`flex w-full items-center gap-3 rounded-md border px-4 py-3 transition-colors ${
                              isSelected
                                ? 'border-accent-ink bg-accent-wash'
                                : 'border-hairline hover:bg-surface-hover'
                            }`}
                          >
                            {inner}
                            <span
                              className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border ${
                                isSelected
                                  ? 'border-accent-ink bg-accent-ink'
                                  : 'border-hairline-strong'
                              }`}
                              style={{ height: 18, width: 18 }}
                            >
                              {isSelected && <Check size={11} className="text-white" />}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>

                  {!award.userHasVoted && selected && (
                    <button
                      onClick={() => handleSubmitVote(award.id)}
                      disabled={isSubmitting}
                      className={`${buttonPrimary} mt-5`}
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit vote'}
                    </button>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <Modal
        isOpen={showNamePrompt}
        onClose={() => {
          setShowNamePrompt(false)
          setPendingVote(null)
          setError(null)
        }}
        title="Your name"
        size="sm"
        footer={
          <>
            <button
              onClick={() => {
                setShowNamePrompt(false)
                setPendingVote(null)
                setError(null)
              }}
              disabled={isSubmitting}
              className={buttonSecondary}
            >
              Cancel
            </button>
            <button
              onClick={handleNameSubmit}
              disabled={isSubmitting}
              className={buttonPrimary}
            >
              {isSubmitting ? 'Submitting…' : 'Submit vote'}
            </button>
          </>
        }
      >
        <FormError>{error}</FormError>

        <label htmlFor="voter-name" className={labelClass}>
          Name
        </label>
        <input
          id="voter-name"
          type="text"
          value={voterName}
          onChange={(e) => setVoterName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
          placeholder="Your full name"
          className={fieldClass}
          autoFocus
        />
        <p className="mt-3 text-[13px] text-ink-tertiary">
          Recorded alongside your vote and remembered on this device.
        </p>
      </Modal>
    </>
  )
}
