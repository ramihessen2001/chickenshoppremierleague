/**
 * Ask the organisers something.
 *
 * Deliberately three fields. Anything longer and people give up and ask in a
 * group chat instead, which is where questions go to die.
 */

'use client'

import { useState, FormEvent } from 'react'
import { Check } from 'lucide-react'
import { submitQuestion } from '@/lib/supabaseData'
import { fieldClass, labelClass } from './Modal'

interface FormState {
  name: string
  email: string
  message: string
  website: string
}

const EMPTY: FormState = { name: '', email: '', message: '', website: '' }

export function QuestionForm() {
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

    const failure = await submitQuestion(form)

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
        <h2 className="mt-4 text-[19px] font-semibold text-ink">Question sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-secondary">
          An organiser will reply to the email address you gave us.
        </p>
        <button
          onClick={() => setIsDone(false)}
          className="mt-6 text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-70"
        >
          Ask something else
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

      <div className="grid gap-5">
        <div>
          <label htmlFor="question-name" className={labelClass}>
            Your name
          </label>
          <input
            id="question-name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="question-email" className={labelClass}>
            Email
          </label>
          <input
            id="question-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1.5 text-[12px] text-ink-tertiary">
            We reply here, so check it for typos.
          </p>
        </div>

        <div>
          <label htmlFor="question-message" className={labelClass}>
            Your question
          </label>
          <textarea
            id="question-message"
            required
            rows={5}
            maxLength={2000}
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* Honeypot: off-screen and skipped by the keyboard, so only a bot
            filling every field will touch it. The server drops anything that
            arrives with it set. */}
        <div className="absolute left-[-9999px]" aria-hidden="true">
          <label htmlFor="question-website">Website</label>
          <input
            id="question-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-7 w-full rounded-pill bg-surface-inverse px-6 py-2.5 text-[14px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {isSubmitting ? 'Sending…' : 'Send question'}
      </button>
    </form>
  )
}
