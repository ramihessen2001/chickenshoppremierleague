/**
 * Site header: league crest either side of the league name.
 */

import Image from 'next/image'
import Link from 'next/link'
import { LEAGUE } from '@/config/league'

export function Header() {
  return (
    <header className="w-full py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex-shrink-0" aria-label="Home">
            <div className="relative w-26 h-26 sm:w-34 sm:h-34">
              <Image
                src={LEAGUE.logoUrl}
                alt={`${LEAGUE.name} logo`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-black">
              {LEAGUE.name}
            </h1>
          </div>

          {/* Decorative mirror of the crest -- hidden from screen readers so the
              league name is not announced twice. */}
          <div className="flex-shrink-0" aria-hidden="true">
            <div className="relative w-26 h-26 sm:w-34 sm:h-34">
              <Image
                src={LEAGUE.logoUrl}
                alt=""
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mt-6" />
      </div>
    </header>
  )
}
