/**
 * Grid of team crests linking to each team's page.
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

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6 text-center">
        <p className="text-gray-700">Loading teams...</p>
      </section>
    )
  }

  if (teams.length === 0) {
    return (
      <section className="py-12 px-4 sm:px-6 text-center">
        <p className="text-gray-700">
          No teams have been added yet. Add them in the database to see them here.
        </p>
      </section>
    )
  }

  return (
    <section className="py-12 px-4 sm:px-6" aria-label="Team navigation">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {teams.map((team) => (
            <Link
              key={team.slug}
              href={`/teams/${team.slug}`}
              className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-white/20 transition-colors group"
              aria-label={`View ${team.name} roster`}
            >
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 group-hover:scale-110 transition-transform">
                <Image
                  src={team.logoUrl}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 112px, 144px"
                  className="object-contain"
                />
              </div>
              <span className="text-sm sm:text-base font-semibold uppercase tracking-wide text-black text-center">
                {team.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
