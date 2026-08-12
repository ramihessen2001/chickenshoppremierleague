/**
 * League registration.
 *
 * Shown beside the headline while the season is in its `signups` phase. The
 * server refuses submissions in any other phase, so closing registration is a
 * single change in the admin panel.
 *
 * Single column throughout: it sits in a narrow column on wide screens, where
 * side-by-side fields would be cramped.
 */

'use client'

import { useState, FormEvent } from 'react'
import { Check } from 'lucide-react'
import { submitSignup } from '@/lib/supabaseData'
import { fieldClass, labelClass } from './Modal'

const POSITIONS = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Any']
const EXPERIENCE = ['First season', 'Casual', 'Experienced', 'Competitive']

interface FormState {
  name: string
  email: string
  phone: string
  position: string
  experience: string
  notes: string
}

const EMPTY: FormState = {
  name: '',
  email: '',
  phone: '',
  position: '',
  experience: '',
  notes: '',
}

export function SignupForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDone, setIsDone] = useState(false)

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [field]: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const failure = await submitSignup({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      position: form.position || undefined,
      experience: form.experience || undefined,
      notes: form.notes || undefined,
    })

    setIsSubmitting(false)

    if (failure === null) {
      setForm(EMPTY)
      setIsDone(true)
    } else {
      setError(failure)
    }
  }

  if (isDone) {
    return (
      <div className="rounded-lg border border-hairline bg-surface p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-positive-wash">
          <Check size={20} className="text-positive" />
        </div>
        <h2 className="mt-4 text-[19px] font-semibold text-ink">You&apos;re in</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-secondary">
          We&apos;ve got your registration. You&apos;ll hear from us before the
          draft with the details.
        </p>
        <button
          onClick={() => setIsDone(false)}
          className="mt-6 text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-70"
        >
          Register someone else
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-hairline bg-surface p-6 sm:p-8"
    >
      {error && (
        <p
          className="mb-6 rounded-md border border-hairline bg-negative-wash px-3.5 py-2.5 text-[13px] text-negative"
          role="alert"
        >
          {error}
        </p>
      )}

      <h2 className="text-[19px] font-semibold text-ink">Register to play</h2>
      <p className="mt-1.5 text-[14px] text-ink-secondary">
        One registration per player.
      </p>

      <div className="mt-6 grid gap-5">
        <div>
          <label htmlFor="signup-name" className={labelClass}>
            Full name
          </label>
          <input
            id="signup-name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="signup-email" className={labelClass}>
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="signup-phone" className={labelClass}>
            Phone <span className="font-normal text-ink-tertiary">optional</span>
          </label>
          <input
            id="signup-phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="signup-position" className={labelClass}>
            Preferred position
          </label>
          <select
            id="signup-position"
            value={form.position}
            onChange={(e) => update('position', e.target.value)}
            className={fieldClass}
          >
            <option value="">No preference</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="signup-experience" className={labelClass}>
            Experience
          </label>
          <select
            id="signup-experience"
            value={form.experience}
            onChange={(e) => update('experience', e.target.value)}
            className={fieldClass}
          >
            <option value="">Prefer not to say</option>
            {EXPERIENCE.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="signup-notes" className={labelClass}>
            Anything we should know?{' '}
            <span className="font-normal text-ink-tertiary">optional</span>
          </label>
          <textarea
            id="signup-notes"
            rows={3}
            value={form.notes}
            onChange={(e) => update('notes', e.target.value)}
            placeholder="Availability, injuries, friends you'd like to play with…"
            className={fieldClass}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 w-full rounded-pill bg-surface-inverse px-6 py-2.5 text-[14px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting…' : 'Register'}
      </button>

      <p className="mt-3 text-center text-[12px] text-ink-tertiary">
        We only use your details to run the league.
      </p>
    </form>
  )
}
