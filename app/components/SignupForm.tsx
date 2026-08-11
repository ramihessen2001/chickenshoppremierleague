/**
 * League registration.
 *
 * Shown on the homepage while the season is in its `signups` phase. The server
 * refuses submissions in any other phase, so closing registration is a single
 * change in the admin panel.
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
        <h3 className="mt-4 text-[19px] font-semibold text-ink">You&apos;re in</h3>
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
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

        <div className="sm:col-span-2">
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

      <div className="mt-7 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-pill bg-surface-inverse px-6 py-2.5 text-[14px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting…' : 'Register'}
        </button>
        <p className="text-[13px] text-ink-tertiary">
          We only use your details to run the league.
        </p>
      </div>
    </form>
  )
}
