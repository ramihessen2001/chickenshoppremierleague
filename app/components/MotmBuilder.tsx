/**
 * The Man of the Match form on the content desk: the media team picks a
 * completed game and uploads the photo. Everything else on the graphic -- the
 * player, their figures, the score and the sponsors -- comes from the box
 * score, so only games with a man of the match recorded are offered.
 *
 * The photo is shrunk in the browser and uploaded as soon as it is chosen,
 * like a story's, but kept larger: it fills the whole 1080 x 1440 graphic.
 */

'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { buttonSecondary, fieldClass, labelClass } from './Modal'
import { preparePhoto, uploadPicture } from './StoryBuilder'
import { getAllGames, getTeams } from '@/lib/supabaseData'

export interface MotmPhoto {
  previewUrl: string
  /** Where the uploaded photo lives; null until the upload has finished. */
  url: string | null
  uploading: boolean
  error: string | null
}

/** Room to crop a full-bleed 1080 x 1440 graphic from a photo of any shape. */
const PHOTO_MAX_SIDE = 2160

interface GameOption {
  id: string
  label: string
}

export function MotmBuilder({
  game,
  onGame,
  photo,
  onPhoto,
  disabled,
}: {
  game: string
  onGame: (id: string) => void
  photo: MotmPhoto | null
  onPhoto: (update: (current: MotmPhoto | null) => MotmPhoto | null) => void
  disabled: boolean
}) {
  const [options, setOptions] = useState<GameOption[] | null>(null)
  const input = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    Promise.all([getAllGames(), getTeams()]).then(([games, teams]) => {
      const name = (slug: string) => teams.find((t) => t.slug === slug)?.name ?? slug
      setOptions(
        games
          .filter((g) => g.status === 'completed' && g.playerOfGame && g.homeScore !== null && g.awayScore !== null)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((g) => ({
            id: g.id,
            label: `${g.weekNumber > 0 ? `MW${g.weekNumber}` : 'Playoffs'} · ${name(g.homeTeamId)} ${g.homeScore}–${g.awayScore} ${name(g.awayTeamId)} · ${g.playerOfGame!.name}`,
          }))
      )
    })
  }, [])

  const attach = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    onPhoto(() => ({ previewUrl: '', url: null, uploading: true, error: null }))
    try {
      const blob = await preparePhoto(file, PHOTO_MAX_SIDE)
      onPhoto((current) => current && { ...current, previewUrl: URL.createObjectURL(blob) })
      const url = await uploadPicture(blob)
      onPhoto((current) => current && { ...current, url, uploading: false })
    } catch (error) {
      onPhoto((current) => current && { ...current, uploading: false, error: error instanceof Error ? error.message : 'The upload failed.' })
    }
  }

  return (
    <div className="mt-6">
      <label htmlFor="motm-game" className={labelClass}>
        Game
      </label>
      <select
        id="motm-game"
        value={game}
        onChange={(e) => onGame(e.target.value)}
        disabled={disabled || !options || options.length === 0}
        className={fieldClass}
      >
        <option value="">
          {!options ? 'Loading games…' : options.length === 0 ? 'No game has a man of the match yet' : 'Choose the game'}
        </option>
        {options?.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[13px] text-ink-tertiary">
        The player, their goals and assists, the score and both sponsors come from the game&apos;s box score.
      </p>

      <p className={`mt-6 ${labelClass}`}>Photo</p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        onChange={attach}
        disabled={disabled}
        className="sr-only"
        aria-label="Photo of the man of the match"
      />
      {photo ? (
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3">
          <div className="aspect-[3/4] w-full border border-hairline bg-surface-hover">
            {photo.previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- a local blob URL
              <img src={photo.previewUrl} alt="Man of the match" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0 text-[12px]">
            <p className={photo.error ? 'text-negative' : 'text-ink-secondary'} role={photo.error ? 'alert' : undefined}>
              {photo.error ?? (photo.uploading ? 'Uploading…' : 'Photo · fills the whole graphic')}
            </p>
            <button type="button" onClick={() => onPhoto(() => null)} disabled={disabled} className="mt-1 underline">
              Remove photo
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} disabled={disabled} className={`w-full ${buttonSecondary}`}>
          Choose a photo
        </button>
      )}
      <p className="mt-2 text-[13px] text-ink-tertiary">
        A portrait photo works best. The bottom third sits under the name and score, so keep the player&apos;s face in the
        upper half.
      </p>
    </div>
  )
}
