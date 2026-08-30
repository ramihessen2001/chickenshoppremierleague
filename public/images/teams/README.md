# Team artwork

Three kinds of image live under `public/images`, all keyed off the team's slug
so one identifier ties the database row, the URL and the artwork together:

    teams/<slug>.svg        crest, shown in the header, tables and fixtures
    teams/kits/<slug>.svg   kit mockup, shown on the team page
    sponsors/<name>.svg     sponsor mark, shown on the team page

`teams/<slug>.svg` is the fallback the site uses when a team's `logo_url`
column is empty, so a correctly named file needs no database change. The other
two are not conventional paths -- they are read from the `kit_image_url` and
`sponsor_logo_url` columns, so set those on the team row (or in
`database/seed-data.json`, then re-seed) when artwork is added.

## Export SVG

Crests are drawn at 20px in a fixtures row and 72px on a team page, and have to
stay sharp on retina on top of that. One vector file covers every one of those
sizes; a raster crest only manages it by shipping the pixels for the largest
use everywhere, and still breaks the first time a layout grows.

Export from Illustrator as SVG, and **make sure the root element keeps its
`viewBox`** -- without one the browser cannot scale the file, and
`disc-backdrop.py` refuses it outright.

Next.js serves local SVGs straight from `public/`, bypassing the image
optimiser, so `dangerouslyAllowSVG` is not needed and nothing has to be added
to `next.config.ts`.

Raster is still right for photographs. Use PNG where transparency matters and
the artwork is flat, WebP for photographic content where it does not.

## Contrast: two crests are drawn for dark shirts

`cscp.svg` is `#a1cbcc` and `sckabul.svg` is a single flat gold. Against the
white the site renders crests on they are 1.76:1 and 2.44:1 -- visible, but
under the 3:1 a graphical object needs. Both are shipped as supplied, because
altering a club's crest is a branding decision rather than a technical one.

`scripts/disc-backdrop.py` is the fix when one is wanted: it nests the crest
inside a filled circle, leaving the artwork itself untouched and the result
still vector. It prints the contrast for every fill in the source and refuses
to write a file that fails 3:1.

    python3 scripts/disc-backdrop.py \
        public/images/teams/sckabul.svg public/images/teams/sckabul-disc.svg \
        --color '#8C1A1A'          # gold on deep maroon, 3.78:1

Kabul's own kit red does not solve it (gold on `#C82828` is 2.27:1), which is
why the example above reaches for a deeper maroon.

## Fall 2026

Slugs are the same prefixes the design files use:

    cscp        Central Sporting Club Of PURO   JAX FISH AND CHICKEN
    sccairo     S.C Cairo                       -
    scparis     S.C Paris                       -
    scdakar     S.C Dakar                       USWAH INSTITUTE
    scramallah  S.C Ramallah                    HOOKS FISH AND CHICKEN
    sckabul     S.C Kabul                       VIP AUTOMOTIVE
    scistanbul  S.C Istanbul Black              BLACK SEA AUTO
    scmansoura  S.C Mansoura                    -

Sponsor logos are named after the sponsor, not the team, because a sponsor can
move between teams from one season to the next: `jaxfnc`, `uswah`, `hooks`,
`vipauto`, `blacksea`.

The `<slug>.png` crests alongside the SVGs are the superseded raster versions.
They are still here only because the database rows point at them until the next
`node database/seed.js` run rewrites `logo_url` to `.svg`; delete them after
that.

## Last season's crests stay put

`dolphins.png`, `eagles.png`, `knights.png`, `lions.png`, `panthers.png` and
`warriors.png` are last season's, and nothing this season references them --
but they must stay at exactly these paths. `archive_teams.logo_url` stores the
absolute path each crest had when the season was archived, so moving them into
a subfolder silently 404s every crest on /archive and on the stats table while
it is showing last season's totals. Archived rows are a record of what was;
they are not rewritten, so the files stay where the record says they are.

## Legacy raster helper

`scripts/trim-image.py` crops the blank margin off a PNG that arrived on a
full-page canvas. Only needed for raster sources:

    python3 scripts/trim-image.py in.png out.png --pad 8 --square
    sips -Z 512 out.png
