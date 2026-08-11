/**
 * Team index: crest and name, linking to each team's page.
 *
 * The grid adapts to however many teams the league has rather than assuming a
 * fixed six.
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTeams } from '@/lib/teamsContext'

export function TeamLogos() {
  const { teams, isLoading } = useTeams()

  return (
    <section
      className="mx-auto max-w-6xl px-5 py-16 sm:px-8"
      aria-labelledby="teams-heading"
    >
      <h2
        id="teams-heading"
        className="text-[28px] font-semibold text-ink sm:text-[32px]"
      >
        Teams
      </h2>

      {isLoading ? (
        <p className="mt-10 text-[15px] text-ink-tertiary">Loading…</p>
      ) : teams.length === 0 ? (
        <p className="mt-10 text-[15px] text-ink-tertiary">
          No teams have been added yet.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {teams.map((team) => (
            <li key={team.slug}>
              <Link
                href={`/teams/${team.slug}`}
                className="flex items-center gap-3.5 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:bg-surface-hover"
              >
                <Image
                  src={team.logoUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 object-contain"
                />
                <span className="truncate text-[15px] font-medium text-ink">
                  {team.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
