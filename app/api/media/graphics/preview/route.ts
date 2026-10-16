/**
 * A graphic drawn from today's data, without a draft. Media team (or admin) only.
 *
 *   GET ?type=table|stat_leaders|slate&ground=black|bone[&week=N] -> PNG
 *   GET ?type=matchday&game=<game id>&ground=black|bone           -> PNG
 *   Any of them also takes &style=<style id> (CSPL by default). Styles still under
 *   design (DRAFT_STYLES in lib/graphics/styles.ts) can be previewed here by id.
 *
 * Team of the Week is not offered here: it needs the six picks, which only
 * come from a draft.
 */

import { fail, requireMedia } from '@/lib/apiAuth'
import {
  buildMatchday,
  buildSlate,
  buildStatLeaders,
  buildTable,
  GraphicInputError,
} from '@/lib/graphics/build'
import { renderGraphic } from '@/lib/graphics/render'
import { GraphicSpec, Ground, GROUNDS } from '@/lib/graphics/spec'
import { DEFAULT_STYLE_ID } from '@/lib/graphics/styles'

export async function GET(request: Request) {
  const denied = await requireMedia()
  if (denied) return denied

  const params = new URL(request.url).searchParams
  const type = params.get('type')
  const ground = (GROUNDS as string[]).includes(params.get('ground') ?? '')
    ? (params.get('ground') as Ground)
    : 'black'
  const week = params.has('week') ? Number(params.get('week')) : undefined
  if (week !== undefined && (!Number.isInteger(week) || week < 0)) {
    return fail('week must be a whole number')
  }

  let spec: GraphicSpec
  try {
    if (type === 'table') spec = await buildTable()
    else if (type === 'stat_leaders') spec = await buildStatLeaders()
    else if (type === 'slate') spec = await buildSlate(week)
    else if (type === 'matchday') {
      const game = params.get('game')
      if (!game) return fail('matchday needs a game id')
      spec = await buildMatchday(game)
    } else return fail('type must be table, stat_leaders, slate or matchday')
  } catch (error) {
    if (error instanceof GraphicInputError) return fail(error.message, 422)
    throw error
  }

  return renderGraphic(spec, ground, params.get('style') ?? DEFAULT_STYLE_ID, { 'Cache-Control': 'private, no-store' })
}
