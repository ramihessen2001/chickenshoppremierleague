/**
 * Header component for YM JAX Soccer League
 * Displays league branding with dual logos and centered title
 */

import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header className="w-full py-6 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Dual logos with centered title */}
        <div className="flex items-center justify-between gap-4">
          {/* Left logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="relative w-26 h-26 sm:w-34 sm:h-34">
              <Image
                src="/images/league_logo.png"
                alt="YM JAX Soccer League Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
          
          {/* Centered title */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-wider text-black">
              YM JAX SOCCER LEAGUE
            </h1>
          </div>
          
          {/* Right logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="relative w-26 h-26 sm:w-34 sm:h-34">
              <Image
                src="/images/league_logo.png"
                alt="YM JAX Soccer League Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>
        
        {/* Gold divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mt-6" />
      </div>
    </header>
  )
}

