/**
 * A completed game's box score.
 */

'use client'

import { Game } from '@/types/game'
import { GameStatistics } from './GameStatistics'
import { Modal } from './Modal'

interface BoxScoreModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
}

export function BoxScoreModal({ game, isOpen, onClose }: BoxScoreModalProps) {
  if (!game) return null

  const played = game.homeScore !== null && game.awayScore !== null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Box score" hideTitle size="lg">
      {played ? (
        <GameStatistics game={game} />
      ) : (
        <div className="py-16 text-center">
          <p className="text-[17px] font-medium text-ink">Not played yet</p>
          <p className="mx-auto mt-2 max-w-xs text-[15px] text-ink-secondary">
            The box score appears once the result has been recorded.
          </p>
        </div>
      )}
    </Modal>
  )
}
