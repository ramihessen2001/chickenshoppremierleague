/**
 * Opens the admin login dialog.
 */

'use client'

import { Shield } from 'lucide-react'

interface AdminButtonProps {
  onClick: () => void
}

export function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white border border-gray-700 hover:border-[#D47F7D] rounded-lg transition-colors"
      aria-label="Admin login"
    >
      <Shield size={16} />
      <span>ADMIN</span>
    </button>
  )
}

