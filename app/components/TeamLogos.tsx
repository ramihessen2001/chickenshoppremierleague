/**
 * TeamLogos component for YM JAX Soccer League
 * Displays all 6 team logos in a grid layout
 */

import Image from 'next/image'
import Link from 'next/link'
import { TEAMS } from '@/config/teams'

export function TeamLogos() {
  return (
    <section className="py-12 px-4 sm:px-6" aria-label="Team navigation">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {TEAMS.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex flex-col items-center gap-3 p-4 rounded-lg hover:bg-white/5 transition-colors group"
              aria-label={`View ${team.name} roster`}
            >
              <div className="relative w-32 h-32 sm:w-42 sm:h-42 group-hover:scale-110 transition-transform">
                <Image
                  src={team.logoUrl}
                  alt={`${team.name} logo`}
                  fill
                  sizes="(max-width: 768px) 128px, 168px"
                  className="object-contain"
                />
              </div>
              <span className="text-sm sm:text-base font-semibold uppercase tracking-wide text-white text-center">
                {team.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

