#!/usr/bin/env python3
"""
Printable stat sheets for the statkeepers: US Letter, landscape, one game a page.

    python3 scripts/stat-sheet.py --blank              # a blank sheet (write everything in)
    python3 scripts/stat-sheet.py                      # the next matchweek, one sheet per game
    python3 scripts/stat-sheet.py --week 3             # a named matchweek

Writes PDFs to stat-sheets/. Needs `pip install reportlab`.

A pre-filled sheet has the game (number, date, slot, venue) and both clubs'
rosters printed in, goalkeepers first, with a few blank rows for anyone added.
The columns are what the statkeepers record on the site: goals, own goals,
assists, saves, yellow cards, red cards. Tally with strokes (||||) and write the
minute in the goal log; the score and man of the match go at the bottom.

Rosters and fixtures are read with the public (anon) Supabase key from .env.local,
so nothing here can write to the database.
"""

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

from reportlab.lib.colors import Color, black, white
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'stat-sheets'

pdfmetrics.registerFont(TTFont('Plex', str(ROOT / 'assets/fonts/IBMPlexSansCondensed-Bold.ttf')))
pdfmetrics.registerFont(TTFont('Mono', str(ROOT / 'assets/fonts/CourierPrime-Regular.ttf')))
pdfmetrics.registerFont(TTFont('MonoBold', str(ROOT / 'assets/fonts/CourierPrime-Bold.ttf')))

PAGE_W, PAGE_H = landscape(letter)  # 792 x 612 pt
MARGIN = 28
GAP = 18
PANEL_W = (PAGE_W - 2 * MARGIN - GAP) / 2

GREY = Color(0.88, 0.88, 0.88)
LIGHT = Color(0.65, 0.65, 0.65)

# What a statkeeper records for each player, in the site's own order.
COLUMNS = [('GOALS', 40), ('OWN\nGOAL', 36), ('ASSISTS', 42), ('SAVES', 38), ('YELLOW\nCARD', 38), ('RED\nCARD', 34)]
NUM_W = 24
POSITION_ORDER = {'goalkeeper': 0, 'defender': 1, 'midfielder': 2, 'forward': 3}
ROWS = 12
SLOT_ORDER = ['assr', 'maghrib', "isha'a"]


# ---------------------------------------------------------------- data

def read_env():
    values = {}
    for line in (ROOT / '.env.local').read_text().splitlines():
        match = re.match(r'^([A-Z_]+)=(.*)$', line.strip())
        if match:
            values[match.group(1)] = match.group(2).strip().strip('"\'')
    return values


def fetch(path, **query):
    env = read_env()
    url = f"{env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/{path}?{urllib.parse.urlencode(query, safe=',:()*.')}"
    request = urllib.request.Request(url, headers={'apikey': env['NEXT_PUBLIC_SUPABASE_ANON_KEY']})
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def slot_rank(slot):
    slot = (slot or '').strip().lower().replace('’', "'")
    return SLOT_ORDER.index(slot) if slot in SLOT_ORDER else len(SLOT_ORDER)


def load_week(week):
    config = fetch('league_config', select='season,current_week')[0]
    games = fetch(
        'games',
        select='game_number,week_number,date,time,location,status,home:home_team_id(name,short_name,players(name,jersey_number,position,is_active)),away:away_team_id(name,short_name,players(name,jersey_number,position,is_active))',
        order='date,game_number',
    )
    if week is None:
        upcoming = [g['week_number'] for g in games if g['status'] == 'scheduled' and g['week_number'] >= config['current_week']]
        week = min(upcoming) if upcoming else config['current_week']
    chosen = [g for g in games if g['week_number'] == week and g['status'] not in ('cancelled', 'postponed') and g['home'] and g['away']]
    chosen.sort(key=lambda g: (g['date'], slot_rank(g['time'])))
    return config['season'], week, chosen


def roster(team):
    players = [p for p in team['players'] if p['is_active']]
    players.sort(key=lambda p: (POSITION_ORDER.get((p['position'] or '').lower(), 4), p['jersey_number'] if p['jersey_number'] is not None else 999, p['name']))
    return players


# ---------------------------------------------------------------- drawing

def text(c, x, y, s, font='Mono', size=9, align='left', color=black):
    c.setFillColor(color)
    c.setFont(font, size)
    {'left': c.drawString, 'right': c.drawRightString, 'center': c.drawCentredString}[align](x, y, s)


def labelled_line(c, x, y, label, width, value=''):
    """A write-in field: a small label, a rule, and the value (if known) printed on it."""
    text(c, x, y + 2, label, 'Mono', 7.5, color=LIGHT if not value else black)
    start = x + c.stringWidth(label, 'Mono', 7.5) + 4
    c.setStrokeColor(black)
    c.setLineWidth(0.6)
    c.line(start, y, x + width, y)
    if value:
        text(c, start + 4, y + 2, value, 'MonoBold', 10)


def header(c, season, game):
    text(c, MARGIN, PAGE_H - MARGIN - 14, 'YM CHICKEN SHOP PREMIER LEAGUE', 'Plex', 20)
    text(c, MARGIN, PAGE_H - MARGIN - 28, f'STAT SHEET  ·  {season.upper()}', 'Mono', 9)
    text(
        c,
        PAGE_W - MARGIN,
        PAGE_H - MARGIN - 28,
        'Tally with strokes (||||)  ·  write the minute of each goal in the goal log',
        'Mono',
        7.5,
        'right',
        LIGHT,
    )
    y = PAGE_H - MARGIN - 52
    g = game or {}
    cell = (PAGE_W - 2 * MARGIN - 3 * 14) / 4
    labelled_line(c, MARGIN, y, 'GAME #', cell * 0.7, str(g.get('game_number', '')) if g else '')
    labelled_line(c, MARGIN + cell * 0.7 + 14, y, 'MATCHWEEK', cell * 0.9, str(g.get('week_number', '')) if g else '')
    labelled_line(c, MARGIN + cell * 1.6 + 28, y, 'DATE', cell * 1.2, nice_date(g['date']) if g else '')
    labelled_line(c, MARGIN + cell * 2.8 + 42, y, 'SLOT', cell * 1.2, g.get('time', '') if g else '')
    return y - 8


def nice_date(iso):
    y, m, d = (int(v) for v in iso.split('-'))
    import datetime

    return datetime.date(y, m, d).strftime('%a %b %-d')


def panel(c, x, top, side, team, players):
    """One club: a title bar, a score box, and a table with a row per player."""
    # Title bar
    bar_h = 26
    c.setFillColor(black)
    c.rect(x, top - bar_h, PANEL_W, bar_h, fill=1, stroke=0)
    text(c, x + 8, top - 17, side, 'Mono', 8, color=white)
    name = (team['short_name'] or team['name']).upper() if team else ''
    if name:
        text(c, x + 8 + c.stringWidth(side, 'Mono', 8) + 10, top - 18, name, 'Plex', 15, color=white)
    # Final score box, set into the bar's right-hand end
    box = 34
    c.setFillColor(white)
    c.rect(x + PANEL_W - box - 4, top - bar_h + 3, box, bar_h - 6, fill=1, stroke=0)
    text(c, x + PANEL_W - box - 8, top - 17, 'SCORE', 'Mono', 7.5, 'right', white)

    # Header row
    head_h = 26
    y = top - bar_h
    c.setFillColor(GREY)
    c.rect(x, y - head_h, PANEL_W, head_h, fill=1, stroke=0)
    name_w = PANEL_W - NUM_W - sum(w for _, w in COLUMNS)
    text(c, x + NUM_W / 2, y - 16, '#', 'MonoBold', 8, 'center')
    text(c, x + NUM_W + 5, y - 16, 'PLAYER', 'MonoBold', 8)
    cx = x + NUM_W + name_w
    for label, w in COLUMNS:
        lines = label.split('\n')
        for i, line in enumerate(lines):
            text(c, cx + w / 2, y - (11 if len(lines) == 2 else 16) - i * 9, line, 'MonoBold', 6.5 if len(lines) == 2 else 7.5, 'center')
        cx += w
    y -= head_h

    # Player rows
    row_h = 21
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    shown = list(players)[:ROWS]
    for i in range(ROWS):
        ry = y - (i + 1) * row_h
        c.line(x, ry, x + PANEL_W, ry)
        if i < len(shown):
            p = shown[i]
            jersey = p['jersey_number']
            if jersey is not None:
                text(c, x + NUM_W / 2, ry + 7, str(jersey), 'MonoBold', 10, 'center')
            label = p['name']
            # One size for every name, shrunk only when a long one would not fit.
            room = name_w - (30 if (p['position'] or '').lower() == 'goalkeeper' else 10)
            size = 10
            while c.stringWidth(label, 'Mono', size) > room and size > 7:
                size -= 0.5
            text(c, x + NUM_W + 5, ry + 7, label, 'Mono', size)
            if (p['position'] or '').lower() == 'goalkeeper':
                text(c, x + NUM_W + name_w - 4, ry + 7, 'GK', 'MonoBold', 7, 'right', LIGHT)
    bottom = y - ROWS * row_h

    # Grid: outer box and the column dividers
    c.setLineWidth(0.8)
    c.rect(x, bottom, PANEL_W, top - bottom, fill=0, stroke=1)
    c.setLineWidth(0.5)
    c.line(x + NUM_W, bottom, x + NUM_W, y)
    cx = x + NUM_W + name_w
    c.line(cx, bottom, cx, y + head_h - 0)
    for _, w in COLUMNS[:-1]:
        cx += w
        c.line(cx, bottom, cx, y + head_h)
    return bottom


def bottom_block(c, top):
    """Goal log on the left; result and signatures on the right."""
    height = top - MARGIN - 6
    left_w = PANEL_W * 1.15
    # Goal log
    text(c, MARGIN, top - 8, 'GOAL LOG', 'MonoBold', 8)
    cols = [('MIN', 36), ('TEAM', 110), ('SCORER', 150), ('ASSIST', left_w - 36 - 110 - 150)]
    y = top - 14
    c.setFillColor(GREY)
    c.rect(MARGIN, y - 14, left_w, 14, fill=1, stroke=0)
    cx = MARGIN
    for label, w in cols:
        text(c, cx + 4, y - 10, label, 'MonoBold', 7)
        cx += w
    y -= 14
    rows = int((y - (MARGIN + 6)) // 17)
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    for i in range(rows):
        ry = y - (i + 1) * 17
        c.line(MARGIN, ry, MARGIN + left_w, ry)
    c.setLineWidth(0.8)
    c.rect(MARGIN, y - rows * 17, left_w, 14 + rows * 17, fill=0, stroke=1)
    cx = MARGIN
    for _, w in cols[:-1]:
        cx += w
        c.setLineWidth(0.5)
        c.line(cx, y - rows * 17, cx, y + 14)

    # Result
    rx = MARGIN + left_w + 22
    rw = PAGE_W - MARGIN - rx
    text(c, rx, top - 8, 'RESULT', 'MonoBold', 8)
    fy = top - 32
    labelled_line(c, rx, fy, 'FINAL SCORE', rw * 0.62)
    labelled_line(c, rx, fy - 25, 'MAN OF THE MATCH', rw)
    labelled_line(c, rx, fy - 50, 'CARDS / NOTES', rw)
    c.setLineWidth(0.6)
    c.line(rx, fy - 74, rx + rw, fy - 74)
    labelled_line(c, rx, fy - 104, 'STATKEEPER', rw * 0.56)
    labelled_line(c, rx + rw * 0.6, fy - 104, 'SIGNED', rw * 0.4)
    text(c, rx, MARGIN + 2, 'Enter this sheet on the site after the game.', 'Mono', 7, color=LIGHT)


def sheet(c, season, game=None):
    home = game['home'] if game else None
    away = game['away'] if game else None
    top = header(c, season, game)
    top -= 10
    bottom = min(
        panel(c, MARGIN, top, 'HOME', home, roster(home) if home else []),
        panel(c, MARGIN + PANEL_W + GAP, top, 'AWAY', away, roster(away) if away else []),
    )
    if not home:
        # Blank sheet: a write-in line for each club's name in its title bar.
        for i, side in enumerate(('HOME', 'AWAY')):
            x = MARGIN + i * (PANEL_W + GAP)
            c.setStrokeColor(white)
            c.setLineWidth(0.6)
            lx = x + 8 + c.stringWidth(side, 'Mono', 8) + 10
            c.line(lx, top - 21, x + PANEL_W - 82, top - 21)
    bottom_block(c, bottom - 12)
    c.showPage()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--blank', action='store_true', help='make one blank sheet instead of pre-filled ones')
    parser.add_argument('--week', type=int, help='matchweek to make sheets for (default: the next one with games to play)')
    args = parser.parse_args()

    OUT.mkdir(exist_ok=True)
    if args.blank:
        path = OUT / 'stat-sheet-blank.pdf'
        c = canvas.Canvas(str(path), pagesize=landscape(letter))
        c.setTitle('CSPL stat sheet (blank)')
        sheet(c, 'Fall 2026')
        c.save()
        print(path)
        return

    season, week, games = load_week(args.week)
    if not games:
        sys.exit(f'Matchweek {week} has no games with both clubs set.')
    path = OUT / f'stat-sheets-matchweek-{week:02d}.pdf'
    c = canvas.Canvas(str(path), pagesize=landscape(letter))
    c.setTitle(f'CSPL stat sheets, matchweek {week}')
    for game in games:
        sheet(c, season, game)
    c.save()
    print(f'{path}  ({len(games)} games, matchweek {week})')


if __name__ == '__main__':
    main()
