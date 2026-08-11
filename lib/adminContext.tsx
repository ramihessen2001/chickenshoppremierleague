/**
 * Admin authentication state.
 *
 * `isAdmin` here controls what the UI offers -- it is a convenience flag, not a
 * security boundary. The real check happens on the server: every admin API
 * route verifies the signed httpOnly session cookie before it writes anything.
 * Flipping this flag in devtools reveals admin buttons that will simply get
 * 401s, which is the behaviour we want.
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

interface AdminContextType {
  isAdmin: boolean
  /** True until the initial session check resolves. */
  isLoading: boolean
  /** Resolves to an error message on failure, or null on success. */
  login: (password: string) => Promise<string | null>
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Ask the server whether this browser already holds a valid session cookie.
  useEffect(() => {
    let cancelled = false

    fetch('/api/admin/session')
      .then((response) => (response.ok ? response.json() : { isAdmin: false }))
      .then((data) => {
        if (!cancelled) setIsAdmin(Boolean(data.isAdmin))
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false)
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
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        return data.error ?? 'Login failed'
      }

      setIsAdmin(true)
      return null
    } catch {
      return 'Could not reach the server. Check your connection and try again.'
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/session', { method: 'DELETE' })
    } finally {
      setIsAdmin(false)
    }
  }, [])

  return (
    <AdminContext.Provider value={{ isAdmin, isLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
