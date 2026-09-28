/**
 * A thin bar shown while a statkeeper session is active. Mirrors AdminBanner;
 * hidden when the same browser is also signed in as admin, since the admin
 * banner already covers it and two bars would just be noise.
 */

'use client'

import { useAdmin } from '@/lib/adminContext'
import { useStatkeeper } from '@/lib/statkeeperContext'

export function StatkeeperBanner() {
  const { isAdmin } = useAdmin()
  const { isStatkeeper, logout } = useStatkeeper()

  if (!isStatkeeper || isAdmin) return null

  return (
    <div className="bg-steel text-ink-inverse">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <p className="flex items-center gap-2 font-util text-[11px] uppercase tracking-[0.04em]">
          <span className="h-1.5 w-1.5 bg-red-lift" aria-hidden="true" />
          Recording stats as statkeeper
        </p>
        <button
          onClick={logout}
          className="font-util text-[11px] uppercase tracking-[0.04em] text-wash transition-opacity hover:opacity-80"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
