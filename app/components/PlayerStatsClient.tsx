/**
 * Player statistics: one sortable table, filterable by team and searchable.
 *
 * Previously this rendered a desktop table and a separate mobile card list with
 * the same data duplicated in both. Now it is a single table that scrolls
 * horizontally on narrow screens.
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { ArrowUp, ArrowDown, Search, Star } from 'lucide-react'
import { getAllPlayersWithStats } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'
import { displayJersey } from '@/types/player'
import { fallbackTeamLogo } from '@/config/league'
import { useAdmin } from '@/lib/adminContext'
import { AwardVoting } from './AwardVoting'
import { AwardManagement } from './AwardManagement'
import { PageHeader } from './PageHeader'

interface PlayerStats {
  id: string
  name: string
  jerseyNumber: number | null
  position: string | null
  team: { id: string; name: string; slug: string; logoUrl: string } | null
  goals: number
  assists: number
  saves: number
  gamesPlayed: number
  manOfTheMatchCount: number
}

type SortField = 'name' | 'team' | 'goals' | 'assists' | 'saves'
type SortOrder = 'asc' | 'desc'

/** Numeric columns sort high-to-low first, which is what you want from a stat. */
const NUMERIC_FIELDS: SortField[] = ['goals', 'assists', 'saves']

export function PlayerStatsClient() {
  const { isAdmin } = useAdmin()
  const { teams } = useTeams()
  const [players, setPlayers] = useState<PlayerStats[]>([])
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('goals')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    let cancelled = false

    getAllPlayersWithStats()
      .then((data) => {
        if (!cancelled) setPlayers(data)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const filteredPlayers = useMemo(() => {
    let result = players

    if (selectedTeam !== 'all') {
      result = result.filter((player) => player.team?.slug === selectedTeam)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (player) =>
          player.name.toLowerCase().includes(query) ||
          (player.jerseyNumber !== null &&
            player.jerseyNumber.toString().includes(query))
      )
    }

    const compare = (a: PlayerStats, b: PlayerStats): number => {
      switch (sortField) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'team':
          return (a.team?.name || '').localeCompare(b.team?.name || '')
        case 'goals':
          return a.goals - b.goals
        case 'assists':
          return a.assists - b.assists
        case 'saves':
          return a.saves - b.saves
      }
    }

    return [...result].sort((a, b) => {
      const primary = sortOrder === 'asc' ? compare(a, b) : -compare(a, b)
      // Ties fall back to name so the order stays stable between renders.
      return primary || a.name.localeCompare(b.name)
    })
  }, [players, selectedTeam, searchQuery, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder(NUMERIC_FIELDS.includes(field) ? 'desc' : 'asc')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Players"
        description="Season totals for every player in the league."
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <section className="mb-14">
          {isAdmin ? <AwardManagement /> : <AwardVoting />}
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
            />
            <input
              type="search"
              placeholder="Search players"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search players"
              className="w-full rounded-pill border border-hairline-strong bg-surface py-2 pl-9 pr-4 text-[14px] text-ink placeholder:text-ink-tertiary focus:border-ink focus:outline-none"
            />
          </div>

          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            aria-label="Filter by team"
            className="rounded-pill border border-hairline-strong bg-surface px-4 py-2 text-[14px] text-ink focus:border-ink focus:outline-none"
          >
            <option value="all">All teams</option>
            {teams.map((team) => (
              <option key={team.slug} value={team.slug}>
                {team.name}
              </option>
            ))}
          </select>

          <p className="tabular ml-auto text-[13px] text-ink-tertiary">
            {filteredPlayers.length}{' '}
            {filteredPlayers.length === 1 ? 'player' : 'players'}
          </p>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-hairline-strong px-6 py-16 text-center">
            <p className="text-[15px] text-ink-secondary">
              {players.length === 0
                ? 'No players have been added yet.'
                : 'No players match those filters.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse">
              <thead>
                <tr className="border-b border-hairline-strong">
                  {(
                    [
                      ['name', 'Player', 'left'],
                      ['team', 'Team', 'left'],
                      ['goals', 'Goals', 'right'],
                      ['assists', 'Assists', 'right'],
                      ['saves', 'Saves', 'right'],
                    ] as [SortField, string, 'left' | 'right'][]
                  ).map(([field, label, align]) => (
                    <SortableHeader
                      key={field}
                      field={field}
                      label={label}
                      align={align}
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b border-hairline transition-colors hover:bg-surface-hover"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="tabular w-7 shrink-0 text-[13px] text-ink-tertiary">
                          {displayJersey(player.jerseyNumber)}
                        </span>
                        <span className="text-[14px] text-ink">{player.name}</span>
                        {player.manOfTheMatchCount > 0 && (
                          <span
                            className="inline-flex shrink-0 items-center gap-0.5 text-[12px] text-ink-tertiary"
                            title={`Man of the match ×${player.manOfTheMatchCount}`}
                          >
                            <Star size={11} className="fill-gold text-gold" />
                            <span className="tabular">{player.manOfTheMatchCount}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 pr-4">
                      {player.team ? (
                        <div className="flex items-center gap-2">
                          <Image
                            src={
                              player.team.logoUrl || fallbackTeamLogo(player.team.slug)
                            }
                            alt=""
                            width={18}
                            height={18}
                            className="h-[18px] w-[18px] shrink-0 object-contain"
                          />
                          <span className="text-[14px] text-ink-secondary">
                            {player.team.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[14px] text-ink-tertiary">—</span>
                      )}
                    </td>

                    <StatCell value={player.goals} />
                    <StatCell value={player.assists} />
                    <StatCell value={player.saves} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

/** A zero is greyed so the eye lands on players who actually contributed. */
function StatCell({ value }: { value: number }) {
  return (
    <td className="py-3 text-right">
      <span
        className={`tabular text-[14px] ${
          value === 0 ? 'text-ink-tertiary' : 'font-medium text-ink'
        }`}
      >
        {value}
      </span>
    </td>
  )
}

/** A clickable column header that reports the current sort to assistive tech. */
function SortableHeader({
  field,
  label,
  align,
  sortField,
  sortOrder,
  onSort,
}: {
  field: SortField
  label: string
  align: 'left' | 'right'
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
}) {
  const isActive = sortField === field

  return (
    <th
      scope="col"
      aria-sort={isActive ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={align === 'right' ? 'text-right' : 'text-left'}
    >
      <button
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 py-3 text-[12px] font-semibold uppercase tracking-wider transition-colors hover:text-ink ${
          isActive ? 'text-ink' : 'text-ink-tertiary'
        }`}
      >
        {label}
        {isActive &&
          (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  )
}
