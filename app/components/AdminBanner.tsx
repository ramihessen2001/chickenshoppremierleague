/**
 * A thin bar shown while an admin session is active, so it is never ambiguous
 * whether an edit will actually be saved.
 */

'use client'

import { useAdmin } from '@/lib/adminContext'

export function AdminBanner() {
  const { isAdmin, logout } = useAdmin()

  if (!isAdmin) return null

  return (
    <div className="bg-surface-inverse text-ink-inverse">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <p className="flex items-center gap-2 text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
          Editing as admin
        </p>
        <button
          onClick={logout}
          className="text-[12px] text-white/70 transition-colors hover:text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
