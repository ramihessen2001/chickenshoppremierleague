/**
 * Modal showing a completed game's box score.
 * Modal overlay displaying detailed game statistics
 */

'use client'

import { useEffect } from 'react'
import { Game } from '@/types/game'
import { GameStatistics } from './GameStatistics'
import { X } from 'lucide-react'

interface BoxScoreModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
}

export function BoxScoreModal({ game, isOpen, onClose }: BoxScoreModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  if (!isOpen || !game) return null
  
  // Show box score if scores exist (including 0-0 for scheduled games)
  const hasScores = game.homeScore !== null && game.awayScore !== null
  const isCompleted = hasScores
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="box-score-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-2 border-[#523232] rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
          aria-label="Close box score"
        >
          <X size={24} />
        </button>
        
        {/* Modal content */}
        <div className="p-6 sm:p-8">
          {!isCompleted ? (
            <div className="text-center py-12">
              <h2 id="box-score-title" className="text-2xl font-bold text-white mb-4">
                Game Not Yet Played
              </h2>
              <p className="text-gray-400">
                Box score will be available after the game is completed.
              </p>
            </div>
          ) : (
            <GameStatistics game={game} />
          )}
        </div>
      </div>
    </div>
  )
}

