/**
 * Modal dialog for admin authentication.
 *
 * The password is checked on the server, so submitting is async and the button
 * has to show a pending state.
 */

'use client'

import { useState, FormEvent, useEffect } from 'react'
import { X } from 'lucide-react'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  /** Resolves to an error message on failure, or null on success. */
  onSubmit: (password: string) => Promise<string | null>
}

export function PasswordModal({ isOpen, onClose, onSubmit }: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    setIsSubmitting(true)
    const message = await onSubmit(password)
    setIsSubmitting(false)

    if (message === null) {
      setPassword('')
      setError('')
      onClose()
    } else {
      setError(message)
      setPassword('')
    }
  }

  const handleClose = () => {
    setPassword('')
    setError('')
    onClose()
  }
  
  if (!isOpen) return null
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-[#0a0a0a] border-2 border-[#523232] rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
        
        {/* Modal content */}
        <div className="p-8">
          <h2 id="password-modal-title" className="text-2xl font-bold mb-6 text-white">
            Admin Authentication
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="admin-password" className="block text-sm font-medium mb-2 text-white">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-black border border-[#523232] rounded focus:border-[#D47F7D] focus:ring-2 focus:ring-[#D47F7D]/50 outline-none transition-colors text-white disabled:opacity-60"
                autoFocus
                aria-describedby={error ? 'password-error' : undefined}
                aria-invalid={error ? 'true' : 'false'}
              />
              {error && (
                <p id="password-error" className="mt-2 text-sm text-red-400" role="alert">
                  {error}
                </p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-[#523232] rounded hover:bg-white/5 transition-colors text-white disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#D47F7D] rounded hover:bg-[#D47F7D]/90 transition-colors font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? 'Checking...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

