/**
 * ClientDataProvider - Wraps components that need client-side data
 * Handles localStorage initialization and provides local data
 */

'use client'

import { useEffect, useState } from 'react'
import { initializeLocalStorage, getLocalGames } from '@/lib/localStore'
import { Game } from '@/types/game'

interface ClientDataProviderProps {
  children: (data: { games: Game[], isLoading: boolean }) => React.ReactNode
}

export function ClientDataProvider({ children }: ClientDataProviderProps) {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Initialize localStorage on mount
    initializeLocalStorage()
    
    // Load games
    const loadedGames = getLocalGames()
    setGames(loadedGames)
    setIsLoading(false)
    
    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = () => {
      setGames(getLocalGames())
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Custom event for same-tab updates
    const handleDataUpdate = () => {
      setGames(getLocalGames())
    }
    
    window.addEventListener('dataUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('dataUpdated', handleDataUpdate)
    }
  }, [])
  
  return <>{children({ games, isLoading })}</>
}

// Helper to trigger data refresh
export function triggerDataRefresh() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('dataUpdated'))
  }
}




