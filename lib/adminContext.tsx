/**
 * Admin Context for YM JAX Soccer League
 * Manages admin authentication state with session storage
 */

'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AdminContextType {
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  login: () => false,
  logout: () => {},
})

// Hardcoded admin password for Phase 1
// Note: This is acceptable for an amateur league with trusted admins
// Phase 3 will implement proper backend authentication
const ADMIN_PASSWORD = 'sport2233'

interface AdminProviderProps {
  children: ReactNode
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Hydration-safe: check sessionStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminStatus = sessionStorage.getItem('admin') === 'true'
      setIsAdmin(adminStatus)
      setIsHydrated(true)
    }
  }, [])
  
  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin', 'true')
      setIsAdmin(true)
      return true
    }
    return false
  }
  
  const logout = () => {
    sessionStorage.removeItem('admin')
    setIsAdmin(false)
  }
  
  // Don't render until hydrated to avoid SSR mismatch
  if (!isHydrated) {
    return <>{children}</>
  }
  
  return (
    <AdminContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}

