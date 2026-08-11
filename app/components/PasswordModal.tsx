/**
 * Admin sign-in.
 *
 * The password is verified on the server, so submitting is async and the button
 * shows a pending state.
 */

'use client'

import { useState, FormEvent } from 'react'
import {
  Modal,
  FormError,
  fieldClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface PasswordModalProps {
  isOpen: boolean
  onClose: () => void
  /** Resolves to an error message on failure, or null on success. */
  onSubmit: (password: string) => Promise<string | null>
}

export function PasswordModal({ isOpen, onClose, onSubmit }: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const close = () => {
    setPassword('')
    setError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!password.trim()) {
      setError('Please enter the password')
      return
    }

    setIsSubmitting(true)
    const message = await onSubmit(password)
    setIsSubmitting(false)

    if (message === null) {
      setPassword('')
      setError(null)
      onClose()
    } else {
      setError(message)
      setPassword('')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={close} title="Admin sign in" size="sm">
      <form onSubmit={handleSubmit} id="admin-signin">
        <FormError>{error}</FormError>

        <label htmlFor="admin-password" className={labelClass}>
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          autoFocus
          autoComplete="current-password"
          className={fieldClass}
          aria-invalid={error ? 'true' : 'false'}
        />

        <p className="mt-3 text-[13px] text-ink-tertiary">
          Signing in lets you edit results, rosters and the schedule. Sessions
          last 12 hours.
        </p>
      </form>

      <div className="mt-6 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={close}
          disabled={isSubmitting}
          className={buttonSecondary}
        >
          Cancel
        </button>
        <button
          type="submit"
          form="admin-signin"
          disabled={isSubmitting}
          className={buttonPrimary}
        >
          {isSubmitting ? 'Checking…' : 'Sign in'}
        </button>
      </div>
    </Modal>
  )
}
