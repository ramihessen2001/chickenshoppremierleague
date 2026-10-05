/**
 * The content desk: the media team writes a brief (or starts from a preset),
 * the content agent drafts it from the league's data, and the draft lands in
 * a review queue. Every draft is edited and approved here before anyone
 * copies it out -- the agent itself cannot publish anything.
 *
 * Signed in separately from admin, with the media team's own password.
 */

'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { buttonPrimary, buttonSecondary, fieldClass, FormError, labelClass } from './Modal'
import { CONTENT_PRESETS, CUSTOM_KIND, presetLabel } from '@/lib/contentPresets'
import { ContentDraft, ContentDraftStatus } from '@/types/contentDraft'

type SessionState = 'checking' | 'signed-out' | 'signed-in'
type QueueView = 'draft' | 'approved'

/** Reads `{ error }` from a failed response, falling back to the status text. */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (typeof body?.error === 'string') return body.error
  } catch {
    // Not JSON -- fall through.
  }
  return response.statusText || 'Something went wrong'
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ContentDesk() {
  const [session, setSession] = useState<SessionState>('checking')

  useEffect(() => {
    fetch('/api/media/session')
      .then((response) => response.json())
      .then((body) => setSession(body?.isMedia ? 'signed-in' : 'signed-out'))
      .catch(() => setSession('signed-out'))
  }, [])

  if (session === 'checking') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="loading">Loading</p>
      </div>
    )
  }

  if (session === 'signed-out') {
    return <DeskSignIn onSignedIn={() => setSession('signed-in')} />
  }

  return <DeskWorkspace onSignedOut={() => setSession('signed-out')} />
}

function DeskSignIn({ onSignedIn }: { onSignedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!password.trim()) {
      setError('Please enter the password')
      return
    }
    setIsSubmitting(true)
    setError(null)
    const response = await fetch('/api/media/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setIsSubmitting(false)
    if (response.ok) {
      onSignedIn()
    } else {
      setError(await errorMessage(response))
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-5">
      <form onSubmit={handleSubmit} className="w-full">
        <p className="eyebrow">Media team</p>
        <h1 className="mt-2 text-[2.5rem] text-ink">Content desk</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
          Sign in with the media team password. Sessions last 12 hours.
        </p>
        <div className="mt-8">
          <FormError>{error}</FormError>
          <label htmlFor="desk-password" className={labelClass}>
            Password
          </label>
          <input
            id="desk-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
          <button type="submit" disabled={isSubmitting} className={`mt-4 w-full ${buttonPrimary}`}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
}

function DeskWorkspace({ onSignedOut }: { onSignedOut: () => void }) {
  const [drafts, setDrafts] = useState<ContentDraft[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [view, setView] = useState<QueueView>('draft')

  const [kind, setKind] = useState(CUSTOM_KIND)
  const [brief, setBrief] = useState('')
  const [isWriting, setIsWriting] = useState(false)
  const [writeError, setWriteError] = useState<string | null>(null)

  const loadDrafts = useCallback(async () => {
    const response = await fetch('/api/media/drafts')
    if (response.status === 401) return onSignedOut()
    if (!response.ok) {
      setLoadError(await errorMessage(response))
      return
    }
    setLoadError(null)
    setDrafts((await response.json()).drafts)
  }, [onSignedOut])

  useEffect(() => {
    loadDrafts()
  }, [loadDrafts])

  const choosePreset = (presetKind: string) => {
    const preset = CONTENT_PRESETS.find((p) => p.kind === presetKind)
    if (!preset) return
    setKind(preset.kind)
    setBrief(preset.brief)
    setWriteError(null)
  }

  const writeDraft = async (event: FormEvent) => {
    event.preventDefault()
    if (!brief.trim()) {
      setWriteError('Write a brief first')
      return
    }
    setIsWriting(true)
    setWriteError(null)
    try {
      const response = await fetch('/api/media/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, brief }),
      })
      if (response.status === 401) return onSignedOut()
      if (!response.ok) {
        setWriteError(await errorMessage(response))
        return
      }
      const { draft } = await response.json()
      setDrafts((current) => [draft, ...current])
      setView('draft')
      setBrief('')
      setKind(CUSTOM_KIND)
    } catch {
      setWriteError('Lost the connection while the draft was being written. Try again.')
    } finally {
      setIsWriting(false)
    }
  }

  const replaceDraft = (updated: ContentDraft) =>
    setDrafts((current) =>
      updated.status === 'discarded'
        ? current.filter((d) => d.id !== updated.id)
        : current.map((d) => (d.id === updated.id ? updated : d))
    )

  const signOut = async () => {
    await fetch('/api/media/session', { method: 'DELETE' })
    onSignedOut()
  }

  const visible = drafts.filter((d) => d.status === view)
  const toReviewCount = drafts.filter((d) => d.status === 'draft').length
  const approvedCount = drafts.filter((d) => d.status === 'approved').length

  return (
    <div className="mx-auto max-w-6xl px-5 pt-12 pb-20 sm:px-8 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-[2.5px] border-hairline-strong pb-5">
        <div>
          <p className="eyebrow">Media team</p>
          <h1 className="mt-2 text-[2.5rem] text-ink sm:text-[3.25rem]">Content desk</h1>
        </div>
        <button type="button" onClick={signOut} className={buttonSecondary}>
          Sign out
        </button>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
        <form onSubmit={writeDraft} className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="text-[26px] text-ink">New draft</h2>

          <p className={`mt-5 ${labelClass}`}>Start from</p>
          <div className="flex flex-wrap gap-1.5">
            {CONTENT_PRESETS.map((preset) => (
              <button
                key={preset.kind}
                type="button"
                onClick={() => choosePreset(preset.kind)}
                disabled={isWriting}
                aria-pressed={kind === preset.kind}
                className={`border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${
                  kind === preset.kind
                    ? 'border-hairline-strong bg-surface-inverse text-ink-inverse'
                    : 'border-hairline-strong text-ink hover:bg-surface-hover'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <label htmlFor="desk-brief" className={`mt-6 ${labelClass}`}>
            Brief
          </label>
          <textarea
            id="desk-brief"
            rows={7}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            disabled={isWriting}
            placeholder="Anything you want: a caption, a report, a newsletter, a roast of the table…"
            className={fieldClass}
          />
          <p className="mt-2 text-[13px] text-ink-tertiary">
            Presets are only a starting point: edit the brief however you like. Fill in anything in
            [BRACKETS].
          </p>

          <div className="mt-5">
            <FormError>{writeError}</FormError>
            <button type="submit" disabled={isWriting} className={`w-full ${buttonPrimary}`}>
              {isWriting ? 'Writing…' : 'Write draft'}
            </button>
            {isWriting && (
              <p className="mt-3 text-[13px] text-ink-tertiary" role="status">
                The agent is reading the league data and writing. This can take a minute.
              </p>
            )}
          </div>
        </form>

        <section aria-labelledby="queue-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="queue-heading" className="text-[26px] text-ink">
              Queue
            </h2>
            <div className="flex gap-1.5" role="group" aria-label="Which drafts to show">
              {(
                [
                  ['draft', `To review (${toReviewCount})`],
                  ['approved', `Approved (${approvedCount})`],
                ] as [QueueView, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  className={`border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    view === value
                      ? 'border-hairline-strong bg-surface-inverse text-ink-inverse'
                      : 'border-hairline-strong text-ink hover:bg-surface-hover'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loadError && (
            <p className="mt-6 text-[13px] text-negative" role="alert">
              {loadError}
            </p>
          )}

          {visible.length === 0 ? (
            <div className="mt-6 border border-hairline px-5 py-10">
              <p className="text-[17px] font-medium text-ink">
                {view === 'draft' ? 'Nothing to review' : 'Nothing approved yet'}
              </p>
              <p className="mt-2 text-[15px] text-ink-secondary">
                {view === 'draft'
                  ? 'Write a brief to get a draft.'
                  : 'Approved drafts wait here, ready to copy out.'}
              </p>
            </div>
          ) : (
            <ol className="mt-6 flex flex-col gap-6">
              {visible.map((draft) => (
                <li key={draft.id}>
                  <DraftCard
                    draft={draft}
                    onChange={replaceDraft}
                    onSignedOut={onSignedOut}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}

function DraftCard({
  draft,
  onChange,
  onSignedOut,
}: {
  draft: ContentDraft
  onChange: (draft: ContentDraft) => void
  onSignedOut: () => void
}) {
  const [text, setText] = useState(draft.body)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const isEdited = text !== draft.body

  const save = async (fields: { body?: string; status?: ContentDraftStatus }) => {
    setIsSaving(true)
    setError(null)
    const response = await fetch(`/api/media/drafts/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    setIsSaving(false)
    if (response.status === 401) return onSignedOut()
    if (!response.ok) {
      setError(await errorMessage(response))
      return
    }
    onChange((await response.json()).draft)
  }

  // Approving saves any unsaved edits in the same request, so what gets
  // approved is always what is on screen.
  const setStatus = (status: ContentDraftStatus) =>
    save(isEdited ? { body: text, status } : { status })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy. Select the text and copy it by hand.')
    }
  }

  return (
    <article className="border border-hairline">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hairline px-5 py-3">
        <p className="eyebrow">{presetLabel(draft.kind)}</p>
        <p className="font-util text-[12px] text-ink-tertiary">{formatWhen(draft.createdAt)}</p>
      </div>

      <div className="px-5 py-4">
        <details className="text-[13px] text-ink-secondary">
          <summary className="cursor-pointer">Brief</summary>
          <p className="mt-2 whitespace-pre-line">{draft.brief}</p>
        </details>

        <label htmlFor={`draft-${draft.id}`} className="sr-only">
          Draft text
        </label>
        <textarea
          id={`draft-${draft.id}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={Math.min(24, Math.max(6, text.split('\n').length + 1))}
          className={`mt-3 ${fieldClass} leading-relaxed`}
        />

        {error && (
          <p className="mt-3 text-[13px] text-negative" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {draft.status === 'draft' ? (
            <button
              type="button"
              onClick={() => setStatus('approved')}
              disabled={isSaving}
              className={buttonPrimary}
            >
              Approve
            </button>
          ) : (
            <button type="button" onClick={copy} className={buttonPrimary}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          {isEdited && (
            <button
              type="button"
              onClick={() => save({ body: text })}
              disabled={isSaving}
              className={buttonSecondary}
            >
              Save edits
            </button>
          )}
          {draft.status === 'approved' && (
            <button
              type="button"
              onClick={() => setStatus('draft')}
              disabled={isSaving}
              className={buttonSecondary}
            >
              Back to review
            </button>
          )}
          <button
            type="button"
            onClick={() => setStatus('discarded')}
            disabled={isSaving}
            className={buttonSecondary}
          >
            Discard
          </button>
        </div>
      </div>
    </article>
  )
}
