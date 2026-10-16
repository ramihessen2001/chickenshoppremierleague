/**
 * The eight club sponsors, as the graphics draw them.
 *
 * The database holds who sponsors whom (teams.sponsor_name / sponsor_logo_url,
 * set by the sponsor migrations); this list is the copy the renderer works
 * from, because a graphic is drawn from assets/ on disk with no database read
 * and the footer strip needs all eight at once. When a sponsorship moves
 * clubs, change `slug` here as well as in the database.
 *
 * `file` is in assets/sponsors/ -- the logos from public/images/sponsors/ with
 * their <style> classes inlined as attributes, which the renderer needs (it
 * ignores <style> inside an image). Black Sea's is the PNG lifted out of its
 * SVG, which the renderer would not draw as embedded. Redo that conversion
 * when a logo changes.
 * Pure data.
 */

export interface Sponsor {
  /** The club it sponsors. */
  slug: string
  name: string
  file: string
}

/** In the league's table order, which is the order the footer strip shows. */
export const SPONSORS: Sponsor[] = [
  { slug: 'cscp', name: 'PURO Airways', file: 'PUROAirways.svg' },
  { slug: 'sccairo', name: 'Fade Factory', file: 'FadeFactory.svg' },
  { slug: 'scparis', name: 'Jax Fish and Chicken', file: 'jaxfnc.svg' },
  { slug: 'scdakar', name: 'Uswah Institute', file: 'uswah.svg' },
  { slug: 'scramallah', name: 'Hook Fish and Chicken', file: 'hooks.svg' },
  { slug: 'sckabul', name: 'VIP Automotive', file: 'vipauto.svg' },
  { slug: 'scistanbul', name: 'Black Sea Auto', file: 'blacksea.png' },
  { slug: 'scmansoura', name: 'Mixers FC', file: 'MixersLion.svg' },
]

export const sponsorOf = (slug: string): Sponsor | undefined => SPONSORS.find((s) => s.slug === slug)
