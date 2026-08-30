/**
 * Admin panel for awards: create them, nominate players, read results.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Users, BarChart3, X } from 'lucide-react'
import { Award } from '@/lib/supabase'
import {
  getAllAwards,
  getAwardNominees,
  createAward,
  updateAward,
  deleteAward,
  addNominee,
  removeNominee,
  getAwardVoteResults,
} from '@/lib/supabaseAwards'
import { getAllPlayersWithStats } from '@/lib/supabaseData'
import { displayJersey } from '@/types/player'
import {
  Modal,
  FormError,
  fieldClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface PlayerStats {
  id: string
  name: string
  jerseyNumber: number | null
  team: { id: string; name: string; slug: string; logoUrl: string } | null
}

interface Nominee {
  id: string
  player_id: string
  playerName: string
}

interface VoteResult {
  nomineeId: string
  playerName: string
  voteCount: number
  voterNames: string[]
}

export function AwardManagement() {
  const [awards, setAwards] = useState<Award[]>([])
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [showNominees, setShowNominees] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedAward, setSelectedAward] = useState<Award | null>(null)

  const [awardForm, setAwardForm] = useState({
    name: '',
    description: '',
    is_active: true,
  })

  const [nominees, setNominees] = useState<Nominee[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [voteResults, setVoteResults] = useState<VoteResult[]>([])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const [awardsData, playersData] = await Promise.all([
      getAllAwards(),
      getAllPlayersWithStats(),
    ])
    setAwards(awardsData)
    setPlayers(playersData)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // fetchData is async, so its setState runs after the queries resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleCreateAward = async () => {
    setError(null)
    if (!awardForm.name.trim()) {
      setError('Please enter an award name')
      return
    }

    try {
      const created = await createAward(awardForm)
      setAwards([created, ...awards])
      setShowCreate(false)
      setAwardForm({ name: '', description: '', is_active: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create award')
    }
  }

  const handleToggleActive = async (award: Award) => {
    try {
      const updated = await updateAward(award.id, { is_active: !award.is_active })
      setAwards(awards.map((a) => (a.id === award.id ? updated : a)))
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Failed to update award')
    }
  }

  const handleDeleteAward = async (awardId: string) => {
    if (!confirm('Delete this award? Its nominees and votes go too.')) return
    try {
      await deleteAward(awardId)
      setAwards(awards.filter((a) => a.id !== awardId))
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Failed to delete award')
    }
  }

  const openNominees = async (award: Award) => {
    setSelectedAward(award)
    setError(null)
    setNominees(await getAwardNominees(award.id))
    setShowNominees(true)
  }

  const handleAddNominee = async () => {
    if (!selectedAward || !selectedPlayerId) return
    setError(null)

    try {
      const nominee = await addNominee(selectedAward.id, selectedPlayerId)
      const player = players.find((p) => p.id === selectedPlayerId)
      setNominees([
        ...nominees,
        { id: nominee.id, player_id: selectedPlayerId, playerName: player?.name ?? '' },
      ])
      setSelectedPlayerId('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to add nominee')
    }
  }

  const handleRemoveNominee = async (nomineeId: string) => {
    try {
      await removeNominee(nomineeId)
      setNominees(nominees.filter((n) => n.id !== nomineeId))
    } catch (caught) {
      alert(caught instanceof Error ? caught.message : 'Failed to remove nominee')
    }
  }

  const openResults = async (award: Award) => {
    setSelectedAward(award)
    setVoteResults(await getAwardVoteResults(award.id))
    setShowResults(true)
  }

  if (isLoading) {
    return <p className="text-[15px] text-ink-tertiary">Loading awards…</p>
  }

  const secondaryAction =
    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink'

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold text-ink">Awards</h2>
          <p className="mt-1.5 text-[14px] text-ink-secondary">
            Create awards, nominate players and read the results.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className={buttonPrimary}>
          Create award
        </button>
      </div>

      {awards.length === 0 ? (
        <div className="mt-6 border border-hairline px-5 py-8 text-left">
          <p className="text-[15px] text-ink-secondary">No awards yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {awards.map((award) => (
            <div
              key={award.id}
              className="rounded-lg border border-hairline bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-[16px] font-semibold text-ink">{award.name}</h3>
                    <span
                      className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                        award.is_active
                          ? 'bg-positive-wash text-positive'
                          : 'bg-surface-sunken text-ink-tertiary'
                      }`}
                    >
                      {award.is_active ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {award.description && (
                    <p className="mt-1.5 text-[14px] text-ink-secondary">
                      {award.description}
                    </p>
                  )}
                  <p className="mt-1 text-[12px] text-ink-tertiary">{award.season}</p>
                </div>

                <button
                  onClick={() => handleDeleteAward(award.id)}
                  className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative"
                  aria-label={`Delete ${award.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-1">
                <button onClick={() => openNominees(award)} className={secondaryAction}>
                  <Users size={14} />
                  Nominees
                </button>
                <button onClick={() => openResults(award)} className={secondaryAction}>
                  <BarChart3 size={14} />
                  Results
                </button>
                <button
                  onClick={() => handleToggleActive(award)}
                  className={secondaryAction}
                >
                  {award.is_active ? 'Close voting' : 'Open voting'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create award"
        size="sm"
        footer={
          <>
            <button onClick={() => setShowCreate(false)} className={buttonSecondary}>
              Cancel
            </button>
            <button onClick={handleCreateAward} className={buttonPrimary}>
              Create
            </button>
          </>
        }
      >
        <FormError>{error}</FormError>

        <div className="space-y-5">
          <div>
            <label htmlFor="award-name" className={labelClass}>
              Name
            </label>
            <input
              id="award-name"
              type="text"
              value={awardForm.name}
              onChange={(e) => setAwardForm({ ...awardForm, name: e.target.value })}
              placeholder="MVP, Golden Boot, Best Goalkeeper"
              className={fieldClass}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="award-description" className={labelClass}>
              Description{' '}
              <span className="font-normal text-ink-tertiary">optional</span>
            </label>
            <textarea
              id="award-description"
              value={awardForm.description}
              onChange={(e) =>
                setAwardForm({ ...awardForm, description: e.target.value })
              }
              rows={3}
              className={fieldClass}
            />
          </div>

          <label className="flex items-center gap-2.5 text-[14px] text-ink">
            <input
              type="checkbox"
              checked={awardForm.is_active}
              onChange={(e) =>
                setAwardForm({ ...awardForm, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-hairline-strong accent-[color:var(--ink)]"
            />
            Open for voting straight away
          </label>

          <p className="text-[13px] text-ink-tertiary">
            The current season is attached automatically.
          </p>
        </div>
      </Modal>

      {/* Nominees */}
      <Modal
        isOpen={showNominees && selectedAward !== null}
        onClose={() => setShowNominees(false)}
        title={selectedAward ? `Nominees · ${selectedAward.name}` : 'Nominees'}
        footer={
          <button onClick={() => setShowNominees(false)} className={buttonSecondary}>
            Done
          </button>
        }
      >
        <FormError>{error}</FormError>

        <div className="flex gap-2">
          <label htmlFor="nominee-player" className="sr-only">
            Player
          </label>
          <select
            id="nominee-player"
            value={selectedPlayerId}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className={fieldClass}
          >
            <option value="">Choose a player…</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {displayJersey(player.jerseyNumber)} · {player.name}
                {player.team ? ` (${player.team.name})` : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddNominee}
            disabled={!selectedPlayerId}
            className={buttonPrimary}
            aria-label="Add nominee"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="mt-6">
          <p className="eyebrow">Nominated ({nominees.length})</p>

          {nominees.length === 0 ? (
            <p className="mt-3 text-[14px] text-ink-tertiary">Nobody yet.</p>
          ) : (
            <ul className="mt-3 border-t border-hairline">
              {nominees.map((nominee) => (
                <li
                  key={nominee.id}
                  className="flex items-center justify-between gap-3 border-b border-hairline py-2.5"
                >
                  <span className="truncate text-[14px] text-ink">
                    {nominee.playerName}
                  </span>
                  <button
                    onClick={() => handleRemoveNominee(nominee.id)}
                    className="shrink-0 rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative"
                    aria-label={`Remove ${nominee.playerName}`}
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      {/* Results */}
      <Modal
        isOpen={showResults && selectedAward !== null}
        onClose={() => setShowResults(false)}
        title={selectedAward ? `Results · ${selectedAward.name}` : 'Results'}
        footer={
          <button onClick={() => setShowResults(false)} className={buttonSecondary}>
            Close
          </button>
        }
      >
        {voteResults.length === 0 ? (
          <p className="py-8 text-center text-[14px] text-ink-tertiary">
            No votes cast yet.
          </p>
        ) : (
          <ul className="border-t border-hairline">
            {voteResults.map((result, index) => (
              <li key={result.nomineeId} className="border-b border-hairline py-3.5">
                <div className="flex items-baseline gap-3">
                  <span className="tabular w-5 shrink-0 text-[13px] text-ink-tertiary">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-[15px] font-medium text-ink">
                    {result.playerName}
                  </span>
                  <span className="tabular text-[15px] font-semibold text-ink">
                    {result.voteCount}
                  </span>
                </div>
                {result.voterNames.length > 0 && (
                  <p className="mt-1 pl-8 text-[12px] text-ink-tertiary">
                    {result.voterNames.join(', ')}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}
