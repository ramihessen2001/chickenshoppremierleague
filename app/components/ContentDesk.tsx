/**
 * The content desk: the media team picks one of the league's six graphics (and
 * may add a line, such as which game), the content agent makes it from the
 * league's data, and it lands in a review queue. Every graphic is approved
 * here before anyone downloads it -- the agent itself cannot publish anything.
 * There are no captions: the agent makes pictures only.
 *
 * Signed in separately from admin, with the media team's own password.
 */

'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import { buttonPrimary, buttonSecondary, fieldClass, FormError, labelClass } from './Modal'
import { CONTENT_PRESETS, presetLabel } from '@/lib/contentPresets'
import { AWARD_LABELS, GRAPHIC_LABELS, GRAPHIC_SIZES, Ground } from '@/lib/graphics/spec'
import { resolveStyle, selectableStyles } from '@/lib/graphics/styles'
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

  const [kind, setKind] = useState('')
  const [details, setDetails] = useState('')
  const [choice, setChoice] = useState('')
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

  const chosen = CONTENT_PRESETS.find((p) => p.kind === kind)

  const writeDraft = async (event: FormEvent) => {
    event.preventDefault()
    if (!chosen) {
      setWriteError('Choose which graphic to make')
      return
    }
    if (chosen.choices && !choice) {
      setWriteError('Choose which award')
      return
    }
    setIsWriting(true)
    setWriteError(null)
    try {
      const response = await fetch('/api/media/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, details, choice }),
      })
      if (response.status === 401) return onSignedOut()
      if (!response.ok) {
        setWriteError(await errorMessage(response))
        return
      }
      const { drafts: made } = (await response.json()) as { drafts: ContentDraft[] }
      setDrafts((current) => [...made, ...current])
      setView('draft')
      setDetails('')
      setKind('')
      setChoice('')
    } catch {
      setWriteError('Lost the connection while the graphic was being made. Try again.')
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
          <h2 className="text-[26px] text-ink">Make a graphic</h2>

          <p id="graphic-choice" className={`mt-5 ${labelClass}`}>
            Which graphic
          </p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="graphic-choice">
            {CONTENT_PRESETS.map((preset) => (
              <button
                key={preset.kind}
                type="button"
                onClick={() => {
                  setKind(preset.kind)
                  setChoice('')
                  setWriteError(null)
                }}
                disabled={isWriting}
                aria-pressed={kind === preset.kind}
                className={`border px-3 py-3 text-left text-[14px] font-medium transition-colors disabled:opacity-50 ${
                  kind === preset.kind
                    ? 'border-hairline-strong bg-surface-inverse text-ink-inverse'
                    : 'border-hairline-strong text-ink hover:bg-surface-hover'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {chosen?.choices && (
            <>
              <p id="award-choice" className={`mt-6 ${labelClass}`}>
                Which award
              </p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="award-choice">
                {chosen.choices.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setChoice(option.value)
                      setWriteError(null)
                    }}
                    disabled={isWriting}
                    aria-pressed={choice === option.value}
                    className={`border px-3 py-3 text-left text-[14px] font-medium transition-colors disabled:opacity-50 ${
                      choice === option.value
                        ? 'border-hairline-strong bg-surface-inverse text-ink-inverse'
                        : 'border-hairline-strong text-ink hover:bg-surface-hover'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}

          <label htmlFor="desk-details" className={`mt-6 ${labelClass}`}>
            Details <span className="font-normal text-ink-tertiary">(optional)</span>
          </label>
          <input
            id="desk-details"
            type="text"
            maxLength={300}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            disabled={isWriting || !chosen}
            placeholder={chosen?.detailHint ?? 'Choose a graphic first'}
            className={fieldClass}
          />

          <div className="mt-5">
            <FormError>{writeError}</FormError>
            <button type="submit" disabled={isWriting || !chosen} className={`w-full ${buttonPrimary}`}>
              {isWriting
                ? 'Making…'
                : kind === 'matchday'
                  ? 'Make stories'
                  : kind === 'thumbnail'
                    ? 'Make thumbnails'
                    : kind === 'week_in_cspl'
                      ? 'Make the series'
                      : 'Make graphic'}
            </button>
            {isWriting && (
              <p className="mt-3 text-[13px] text-ink-tertiary" role="status">
                The agent is reading the league data and making the graphic. This can take a minute.
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
                  ? 'Make a graphic to see it here.'
                  : 'Approved graphics wait here, ready to download.'}
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
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const styles = selectableStyles(draft.style)
  const grounds = resolveStyle(draft.style).grounds

  const save = async (fields: { status?: ContentDraftStatus; ground?: Ground; style?: string }) => {
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

  const setStatus = (status: ContentDraftStatus) => save({ status })

  return (
    <article className="border border-hairline">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-hairline px-5 py-3">
        <p className="eyebrow">
          {presetLabel(draft.kind)}
          {draft.graphic?.type === 'award_race' && ` · ${AWARD_LABELS[draft.graphic.award]}`}
          {draft.kind === 'week_in_cspl' &&
            draft.graphic &&
            ` · ${draft.graphic.type === 'story' ? draft.graphic.label : GRAPHIC_LABELS[draft.graphic.type]}`}
        </p>
        <p className="font-util text-[12px] text-ink-tertiary">{formatWhen(draft.createdAt)}</p>
      </div>

      <div className="px-5 py-4">
        <details className="text-[13px] text-ink-secondary">
          <summary className="cursor-pointer">Request</summary>
          <p className="mt-2 whitespace-pre-line">{draft.brief}</p>
        </details>

        {/* The agent only writes here when something needs the team's attention
            (missing data, a game it could not find). A graphic needs no caption. */}
        {draft.body && (
          <p className="mt-3 border-l-2 border-hairline-strong pl-3 text-[14px] text-ink-secondary whitespace-pre-line">
            {draft.body}
          </p>
        )}

        {draft.graphic && (
          <div className="mt-4 mx-auto w-full max-w-sm">
            {/* A plain <img>: the PNG comes from an authenticated route,
                which next/image's optimiser cannot fetch. updatedAt changes
                whenever the style or background does, so the preview
                refreshes. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/media/drafts/${draft.id}/image?v=${encodeURIComponent(draft.updatedAt)}`}
              alt={`${GRAPHIC_LABELS[draft.graphic.type]} graphic`}
              width={GRAPHIC_SIZES[draft.graphic.type].width}
              height={GRAPHIC_SIZES[draft.graphic.type].height}
              className="h-auto w-full border border-hairline"
            />

            {/* With a single style and background there is nothing to choose,
                so the controls only appear once the league has more than one. */}
            {styles.length > 1 && (
              <>
                <label htmlFor={`style-${draft.id}`} className={`mt-3 ${labelClass}`}>
                  Style
                </label>
                <select
                  id={`style-${draft.id}`}
                  value={draft.style}
                  onChange={(e) => save({ style: e.target.value })}
                  disabled={isSaving}
                  className={fieldClass}
                >
                  {styles.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            {grounds.length > 1 && (
              <div className="mt-2 flex gap-1.5" role="group" aria-label="Graphic background">
                {grounds.map((ground) => (
                  <button
                    key={ground}
                    type="button"
                    onClick={() => ground !== draft.ground && save({ ground })}
                    disabled={isSaving}
                    aria-pressed={draft.ground === ground}
                    className={`flex-1 border px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-50 ${
                      draft.ground === ground
                        ? 'border-hairline-strong bg-surface-inverse text-ink-inverse'
                        : 'border-hairline-strong text-ink hover:bg-surface-hover'
                    }`}
                  >
                    {resolveStyle(draft.style).palettes[ground].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 text-[13px] text-negative" role="alert">
            {error}
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {draft.status === 'draft' && (
            <button type="button" onClick={() => setStatus('approved')} disabled={isSaving} className={buttonPrimary}>
              Approve
            </button>
          )}
          {draft.graphic && (
            <a
              href={`/api/media/drafts/${draft.id}/image?download=1&v=${encodeURIComponent(draft.updatedAt)}`}
              download
              className={draft.status === 'approved' ? buttonPrimary : buttonSecondary}
            >
              Download image
            </a>
          )}
          {draft.status === 'approved' && (
            <button type="button" onClick={() => setStatus('draft')} disabled={isSaving} className={buttonSecondary}>
              Back to review
            </button>
          )}
          <button type="button" onClick={() => setStatus('discarded')} disabled={isSaving} className={buttonSecondary}>
            Discard
          </button>
        </div>
      </div>
    </article>
  )
}
