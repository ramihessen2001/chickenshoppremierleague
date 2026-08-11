/**
 * QuickEditButton - Small edit icon that appears in admin mode
 */

'use client'

import { useAdmin } from '@/lib/adminContext'
import { Pencil } from 'lucide-react'

interface QuickEditButtonProps {
  onClick: () => void
  label: string
}

export function QuickEditButton({ onClick, label }: QuickEditButtonProps) {
  const { isAdmin } = useAdmin()
  
  if (!isAdmin) return null
  
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#D47F7D] hover:bg-[#D47F7D]/10 rounded transition-colors"
      aria-label={label}
    >
      <Pencil size={14} />
      <span>Edit</span>
    </button>
  )
}



