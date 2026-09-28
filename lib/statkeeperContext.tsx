/**
 * Statkeeper authentication state.
 *
 * Mirrors lib/adminContext.tsx -- see that file for why `isStatkeeper` is a
 * convenience flag rather than a security boundary. The real check happens on
 * the server, in /api/statkeeper/games/[id]/box-score.
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'

interface StatkeeperContextType {
  isStatkeeper: boolean
  /** True until the initial session check resolves. */
  isLoading: boolean
  /** Resolves to an error message on failure, or null on success. */
  login: (password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const StatkeeperContext = createContext<StatkeeperContextType | null>(null)

export function StatkeeperProvider({ children }: { children: ReactNode }) {
  const [isStatkeeper, setIsStatkeeper] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch('/api/statkeeper/session')
      .then((response) => (response.ok ? response.json() : { isStatkeeper: false }))
      .then((data) => {
        if (!cancelled) setIsStatkeeper(Boolean(data.isStatkeeper))
      })
      .catch(() => {
        if (!cancelled) setIsStatkeeper(false)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (password: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/statkeeper/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        return data.error ?? 'Login failed'
      }

      setIsStatkeeper(true)
      return null
    } catch {
      return 'Could not reach the server. Check your connection and try again.'
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/statkeeper/session', { method: 'DELETE' })
    } finally {
      setIsStatkeeper(false)
    }
  }, [])

  return (
    <StatkeeperContext.Provider value={{ isStatkeeper, isLoading, login, logout }}>
      {children}
    </StatkeeperContext.Provider>
  )
}

export function useStatkeeper() {
  const context = useContext(StatkeeperContext)
  if (!context) {
    throw new Error('useStatkeeper must be used within a StatkeeperProvider')
  }
  return context
}
