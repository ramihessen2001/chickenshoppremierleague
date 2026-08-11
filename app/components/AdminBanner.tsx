/**
 * Persistent banner shown while an admin session is active.
 */

'use client'

import { useAdmin } from '@/lib/adminContext'
import { Shield, X } from 'lucide-react'

export function AdminBanner() {
  const { isAdmin, logout } = useAdmin()
  
  if (!isAdmin) return null
  
  return (
    <div className="sticky top-0 z-50 bg-orange-600 text-white px-4 sm:px-6 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield size={20} />
          <span className="font-semibold uppercase text-sm sm:text-base">
            Admin Mode Active
          </span>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/20 hover:bg-white/30 rounded transition-colors text-sm"
          aria-label="Exit admin mode"
        >
          <X size={16} />
          <span className="hidden sm:inline">Exit Admin Mode</span>
          <span className="sm:hidden">Exit</span>
        </button>
      </div>
    </div>
  )
}




