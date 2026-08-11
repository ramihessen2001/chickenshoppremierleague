# Chicken Shop Premier League

League website: fixtures, rosters, standings, statistics, box scores, playoff
bracket and end-of-season award voting.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 and
Supabase.

---

## Getting started

You need Node.js 20 or newer. Check with `node --version`; if that command is
not found, install it from [nodejs.org](https://nodejs.org) first.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

### Setting up the database

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `database/schema.sql`, and run
   it. This creates every table, index, policy and the storage bucket, and
   inserts the league configuration row.
3. Copy your credentials from **Project Settings → API** into `.env.local`.
4. Put your teams and players into `database/seed-data.json`, then:

```bash
npm run seed            # add the data
npm run seed -- --reset # or wipe teams/players/games first
```

Teams can also be added directly in the Supabase table editor — the site reads
the team list from the database at runtime, so nothing in the code needs to
change when teams do.

### Environment variables

| Variable | Where it is used | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser | Read-only under our RLS policies |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Bypasses RLS. No `NEXT_PUBLIC_` prefix, deliberately |
| `ADMIN_PASSWORD` | server only | Checked at `/api/admin/session` |
| `ADMIN_SESSION_SECRET` | server only | Signs the session cookie; 32+ chars |

Generate a session secret with `openssl rand -hex 32`.

---

## How it is put together

```
app/
  api/
    admin/           every write, behind an admin session check
    votes/           public award voting
  components/        UI
  teams/[teamId]/    team page, keyed by slug
lib/
  supabase.ts        browser client (anon key, reads only)
  supabaseAdmin.ts   server client (service role) -- SERVER ONLY
  auth.ts            password check + signed session cookie -- SERVER ONLY
  supabaseData.ts    reads via anon key, writes via /api/admin/*
  teamsContext.tsx   teams loaded from the database, shared via context
config/league.ts     league name, crest, external links
database/            schema.sql, seed.js, seed-data.json
```

### Security model

The browser only ever holds the anon key, and RLS lets that key do nothing but
`SELECT`. Every write — admin edits, award votes, image uploads — goes through a
Next.js route handler that verifies a signed, httpOnly session cookie and then
uses the service role key server-side.

The `isAdmin` flag in React controls which buttons are visible; it is not a
security boundary. Setting it by hand reveals admin controls that will return
401s.

Do **not** add `NEXT_PUBLIC_` to `SUPABASE_SERVICE_ROLE_KEY`. That prefix inlines
the value into the JavaScript bundle, which would give any visitor full
read/write/delete on the database.

### Season configuration

Season-level values live in the `league_config` table, not in code:

| Column | Meaning |
| --- | --- |
| `season` | Label shown on the homepage, e.g. "Fall 2026" |
| `current_week` | Which week the homepage features |
| `total_weeks` | How many weeks the schedule spans |
| `playoffs_started` | When true, the homepage shows the bracket instead of weekly fixtures |
| `standings_image_url` | Set by the standings upload |

`current_week` and `playoffs_started` are both controlled from the admin panel
on the homepage.

### Playoffs

Playoff games are ordinary rows in `games` with `week_number = 0`, `is_playoff =
true`, and `playoff_round` set to one of `play-in`, `quarterfinal`, `semifinal`
or `final`. The bracket groups them by round and derives round dates from the
games themselves. The championship card renders whichever game is the `final`,
and shows nothing until one exists. Playoff fixtures may have an empty team slot
for a matchup that is not decided yet.

---

## Admin

Click **ADMIN** in the footer and enter `ADMIN_PASSWORD`. A session lasts 12
hours. While signed in you can:

- edit box scores (scores are calculated from the goals you record)
- pick the man of the match
- add, edit and delete games and players
- set the current week and switch the site into playoff mode
- upload a standings image
- create awards, nominate players, and read vote results

---

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm start          # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run seed       # load database/seed-data.json
```

---

## Deploying

Push to GitHub and import the repository in Vercel. Set all five environment
variables in the Vercel project settings — the build will fail without them,
which is intentional: a missing key should stop the deploy rather than produce a
site that cannot talk to its database.
