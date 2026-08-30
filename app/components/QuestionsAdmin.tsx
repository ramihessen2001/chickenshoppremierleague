/**
 * The inbox for the contact form.
 *
 * Replies go out from a normal mail client -- the "Reply" link opens one with
 * the question quoted -- so nothing here pretends to be a help desk. All this
 * has to do is stop a question being forgotten, which is what marking one
 * answered is for.
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getQuestions, updateQuestion, deleteQuestion } from '@/lib/supabaseData'
import { Question, QuestionStatus } from '@/lib/supabase'
import { PageHeader } from './PageHeader'

const FILTERS: [QuestionStatus | 'all', string][] = [
  ['all', 'All'],
  ['new', 'Unanswered'],
  ['answered', 'Answered'],
]

/**
 * `created_at` is a full timestamp, so it needs the time as well as the date --
 * `formatDate` in lib/dateUtils takes a plain YYYY-MM-DD and would choke here.
 */
function formatReceived(timestamp: string): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function QuestionsAdmin() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<QuestionStatus | 'all'>('new')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setQuestions(await getQuestions())
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load questions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const tally = new Map<QuestionStatus, number>()
    for (const question of questions) {
      tally.set(question.status, (tally.get(question.status) ?? 0) + 1)
    }
    return tally
  }, [questions])

  const visible = useMemo(
    () =>
      filter === 'all' ? questions : questions.filter((q) => q.status === filter),
    [questions, filter]
  )

  const setStatus = async (question: Question, status: QuestionStatus) => {
    setBusyId(question.id)
    setError(null)
    try {
      const updated = await updateQuestion(question.id, status)
      setQuestions((current) =>
        current.map((q) => (q.id === question.id ? { ...q, ...updated } : q))
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (question: Question) => {
    if (!confirm(`Delete this question from ${question.name}?`)) return

    setBusyId(question.id)
    try {
      await deleteQuestion(question.id)
      setQuestions((current) => current.filter((q) => q.id !== question.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  const chip = (active: boolean) =>
    `rounded-pill border px-3 py-1.5 text-[13px] font-medium transition-colors ${
      active
        ? 'border-ink bg-surface-inverse text-ink-inverse'
        : 'border-hairline-strong text-ink hover:bg-surface-hover'
    }`

  const unanswered = counts.get('new') ?? 0

  return (
    <>
      <PageHeader
        title="Questions"
        description={
          unanswered === 0
            ? 'Nothing waiting for a reply.'
            : `${unanswered} ${unanswered === 1 ? 'question is' : 'questions are'} waiting for a reply.`
        }
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {error && (
          <p
            className="mb-6 rounded-lg border border-hairline bg-negative-wash px-4 py-3 text-[14px] text-negative"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={chip(filter === value)}
            >
              {label}{' '}
              {value === 'all' ? questions.length : (counts.get(value) ?? 0)}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="mt-8 border border-hairline px-5 py-8 text-left">
            <p className="text-[15px] text-ink-secondary">
              {questions.length === 0
                ? 'Nobody has asked anything yet.'
                : 'Nothing with that status.'}
            </p>
          </div>
        ) : (
          <ul className="mt-8 border-t border-hairline">
            {visible.map((question) => (
              <li
                key={question.id}
                className="grid gap-4 border-b border-hairline py-5 lg:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <p className="text-[15px] font-medium text-ink">
                      {question.name}
                    </p>
                    {question.status === 'new' && (
                      <span className="rounded-pill bg-accent-wash px-2 py-0.5 text-[11px] font-semibold tracking-wider text-accent-ink uppercase">
                        new
                      </span>
                    )}
                    <span className="text-[13px] text-ink-tertiary">
                      {formatReceived(question.created_at)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-[13px] text-ink-secondary">
                    <a
                      href={`mailto:${question.email}`}
                      className="underline decoration-hairline-strong underline-offset-2 hover:decoration-ink"
                    >
                      {question.email}
                    </a>
                  </p>

                  <p className="mt-2 max-w-prose whitespace-pre-line text-[14px] leading-relaxed text-ink">
                    {question.message}
                  </p>
                </div>

                <div className="flex flex-wrap items-start gap-2">
                  {/* Opens the admin's own mail client with the question
                      quoted, so the reply comes from a real address. */}
                  <a
                    href={`mailto:${question.email}?subject=${encodeURIComponent(
                      'Re: your question'
                    )}&body=${encodeURIComponent(
                      `\n\n---\nYou asked:\n${question.message}`
                    )}`}
                    className="rounded-pill border border-hairline-strong px-3.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
                  >
                    Reply
                  </a>

                  <button
                    onClick={() =>
                      setStatus(
                        question,
                        question.status === 'answered' ? 'new' : 'answered'
                      )
                    }
                    disabled={busyId === question.id}
                    className="rounded-pill border border-hairline-strong px-3.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
                  >
                    {question.status === 'answered'
                      ? 'Mark unanswered'
                      : 'Mark answered'}
                  </button>

                  <button
                    onClick={() => handleDelete(question)}
                    disabled={busyId === question.id}
                    aria-label={`Delete question from ${question.name}`}
                    className="rounded-md p-2 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
