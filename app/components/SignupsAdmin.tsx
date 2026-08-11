/**
 * Admin view of registrations: triage them, then run the draft from here.
 *
 * "Draft to team" both records the pick and creates the player on that roster,
 * so draft night does not mean re-typing every name into the roster editor.
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import {
  getSignups,
  updateSignup,
  deleteSignup,
  notifyDataUpdated,
  SignupWithTeam,
} from '@/lib/supabaseData'
import { SignupStatus } from '@/lib/supabase'
import { useTeams } from '@/lib/teamsContext'
import { PageHeader } from './PageHeader'

const STATUSES: [SignupStatus, string][] = [
  ['pending', 'Pending'],
  ['confirmed', 'Confirmed'],
  ['waitlisted', 'Waitlisted'],
  ['drafted', 'Drafted'],
  ['withdrawn', 'Withdrawn'],
]

const STATUS_STYLES: Record<SignupStatus, string> = {
  pending: 'bg-surface-sunken text-ink-secondary',
  confirmed: 'bg-positive-wash text-positive',
  waitlisted: 'bg-accent-wash text-accent-ink',
  drafted: 'bg-surface-inverse text-ink-inverse',
  withdrawn: 'bg-negative-wash text-negative',
}

export function SignupsAdmin() {
  const { teams } = useTeams()
  const [signups, setSignups] = useState<SignupWithTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SignupStatus | 'all'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setSignups(await getSignups())
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load signups')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const tally = new Map<SignupStatus, number>()
    for (const signup of signups) {
      tally.set(signup.status, (tally.get(signup.status) ?? 0) + 1)
    }
    return tally
  }, [signups])

  const visible = useMemo(
    () =>
      statusFilter === 'all'
        ? signups
        : signups.filter((s) => s.status === statusFilter),
    [signups, statusFilter]
  )

  const patch = async (
    id: string,
    fields: Parameters<typeof updateSignup>[1]
  ) => {
    setBusyId(id)
    setError(null)
    try {
      const updated = await updateSignup(id, fields)
      setSignups((current) =>
        current.map((s) => (s.id === id ? { ...s, ...updated } : s))
      )
      notifyDataUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const handleDraft = (signup: SignupWithTeam, teamId: string) => {
    if (!teamId) return patch(signup.id, { draftedTeamId: null })

    const team = teams.find((t) => t.id === teamId)
    const confirmed = confirm(
      `Draft ${signup.name} to ${team?.name ?? 'this team'}?\n\n` +
        'This also adds them to that roster as a player with no shirt number yet.'
    )
    if (!confirmed) return

    return patch(signup.id, {
      draftedTeamId: teamId,
      status: 'drafted',
      createPlayer: true,
    })
  }

  const handleDelete = async (signup: SignupWithTeam) => {
    if (!confirm(`Delete ${signup.name}'s registration? This cannot be undone.`)) {
      return
    }

    setBusyId(signup.id)
    try {
      await deleteSignup(signup.id)
      setSignups((current) => current.filter((s) => s.id !== signup.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  const chip = (active: boolean) =>
    `rounded-pill border px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active
        ? 'border-ink bg-surface-inverse text-ink-inverse'
        : 'border-hairline-strong text-ink hover:bg-surface-hover'
    }`

  return (
    <>
      <PageHeader
        title="Signups"
        description={`${signups.length} ${signups.length === 1 ? 'registration' : 'registrations'} for this season.`}
        actions={
          // A file download from an API route, not a page navigation, so
          // next/link would be wrong here.
          <a
            href="/api/admin/signups?format=csv"
            download
            className="inline-flex items-center gap-1.5 rounded-pill border border-hairline-strong px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            <Download size={15} />
            Export CSV
          </a>
        }
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {error && (
          <p
            className="mb-6 rounded-lg border border-hairline bg-negative-wash px-4 py-3 text-[14px] text-negative"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setStatusFilter('all')} className={chip(statusFilter === 'all')}>
            All {signups.length}
          </button>
          {STATUSES.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={chip(statusFilter === value)}
            >
              {label} {counts.get(value) ?? 0}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-hairline-strong px-6 py-16 text-center">
            <p className="text-[15px] text-ink-secondary">
              {signups.length === 0
                ? 'Nobody has registered yet.'
                : 'No registrations with that status.'}
            </p>
          </div>
        ) : (
          <ul className="mt-8 border-t border-hairline">
            {visible.map((signup) => (
              <li
                key={signup.id}
                className="grid gap-4 border-b border-hairline py-5 lg:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <p className="text-[15px] font-medium text-ink">{signup.name}</p>
                    <span
                      className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${STATUS_STYLES[signup.status]}`}
                    >
                      {signup.status}
                    </span>
                    {signup.drafted_team && (
                      <span className="text-[13px] text-ink-secondary">
                        → {signup.drafted_team.name}
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-secondary">
                    <a
                      href={`mailto:${signup.email}`}
                      className="underline decoration-hairline-strong underline-offset-2 hover:decoration-ink"
                    >
                      {signup.email}
                    </a>
                    {signup.phone && <span>{signup.phone}</span>}
                    {signup.position && (
                      <span className="text-ink-tertiary">{signup.position}</span>
                    )}
                    {signup.experience && (
                      <span className="text-ink-tertiary">{signup.experience}</span>
                    )}
                  </p>

                  {signup.notes && (
                    <p className="mt-2 max-w-prose text-[13px] text-ink-tertiary">
                      {signup.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-start gap-2">
                  <label className="sr-only" htmlFor={`status-${signup.id}`}>
                    Status for {signup.name}
                  </label>
                  <select
                    id={`status-${signup.id}`}
                    value={signup.status}
                    disabled={busyId === signup.id}
                    onChange={(e) =>
                      patch(signup.id, { status: e.target.value as SignupStatus })
                    }
                    className="rounded-md border border-hairline-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none disabled:opacity-50"
                  >
                    {STATUSES.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <label className="sr-only" htmlFor={`team-${signup.id}`}>
                    Draft {signup.name} to a team
                  </label>
                  <select
                    id={`team-${signup.id}`}
                    value={signup.drafted_team_id ?? ''}
                    disabled={busyId === signup.id || teams.length === 0}
                    onChange={(e) => handleDraft(signup, e.target.value)}
                    className="rounded-md border border-hairline-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink focus:border-ink focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Undrafted</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleDelete(signup)}
                    disabled={busyId === signup.id}
                    aria-label={`Delete ${signup.name}`}
                    className="rounded-md p-2 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
