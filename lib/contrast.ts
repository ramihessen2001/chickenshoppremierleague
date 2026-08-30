/**
 * Contrast maths, so a brand colour can be used as type without guessing
 * whether it will be readable.
 *
 * The club colours are stored exactly as the clubs specify them. Several are
 * dark by design -- Istanbul Black is #231f20 -- and the draft announcement
 * puts club names on a black ground, where those would be somewhere between
 * hard to read and invisible. Rather than keep a second, hand-picked "screen"
 * colour per club and let the two drift apart, the stored value is lightened
 * at render time only as far as it has to be.
 *
 * Pure and dependency-free, like lib/draft.ts and lib/standings.ts.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** Parses #rgb or #rrggbb. Returns null for anything else. */
export function parseHex(hex: string | null | undefined): Rgb | null {
  if (!hex) return null
  let value = hex.trim().replace(/^#/, '')
  if (value.length === 3) value = value.replace(/./g, (c) => c + c)
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  }
}

export function toHex({ r, g, b }: Rgb): string {
  const pair = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${pair(r)}${pair(g)}${pair(b)}`
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * The given colour, lightened just enough to clear `minRatio` against
 * `ground`, or returned untouched when it already does.
 *
 * Mixing towards white rather than shifting hue: a club's blue stays that
 * blue, only paler. A colour with no saturation left -- a near-black -- can
 * only come back as a grey, which is the honest way to render "black" on a
 * black ground.
 *
 * `minRatio` defaults to 3, the WCAG threshold for large text, which is what
 * these names are set at.
 */
export function lightenForContrast(
  hex: string | null | undefined,
  groundHex: string,
  minRatio = 3,
  fallbackHex = '#efede8'
): string {
  const colour = parseHex(hex)
  const ground = parseHex(groundHex)
  if (!colour || !ground) return fallbackHex
  if (contrastRatio(colour, ground) >= minRatio) return toHex(colour)

  // Walk towards white in small steps and stop at the first one that passes,
  // so the result is the closest readable version of the club's own colour
  // rather than a wholesale replacement.
  for (let step = 1; step <= 20; step++) {
    const mix = step / 20
    const lightened: Rgb = {
      r: colour.r + (255 - colour.r) * mix,
      g: colour.g + (255 - colour.g) * mix,
      b: colour.b + (255 - colour.b) * mix,
    }
    if (contrastRatio(lightened, ground) >= minRatio) return toHex(lightened)
  }
  return fallbackHex
}
