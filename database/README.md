# Database

## Files

| File | Purpose |
| --- | --- |
| `schema.sql` | The whole schema. Run once against a fresh Supabase project. |
| `seed.js` | Loads `seed-data.json` into the database. |
| `seed-data.json` | Your teams, players and fixtures. Edit this. |
| `migrations/` | Numbered changes for a database already in use. Run them in order, once each. Skip them on a fresh project — `schema.sql` includes everything. |

## First-time setup

1. In Supabase, open **SQL Editor → New query**, paste all of `schema.sql`, run
   it. It is written to run top to bottom on an empty project.
2. Fill in `seed-data.json`.
3. `npm run seed`

Re-running `seed.js` upserts teams by slug and appends players, so running it
twice will duplicate players. Use `npm run seed -- --reset` to clear
`teams`, `players`, `games`, `game_statistics` and `award_nominees` first.

## seed-data.json

```jsonc
{
  "teams": [
    {
      "name": "Falcons",           // required
      "slug": "falcons",           // optional, derived from name
      "logoUrl": "/images/teams/falcons.png",  // optional
      "primaryColor": "#B23A48",   // optional, used for UI accents
      "displayOrder": 0,           // optional, controls ordering
      "players": [
        "Player With No Number",                          // jersey -> TBD
        { "name": "Omar Helmy", "jerseyNumber": 7 },
        { "name": "Sara Khan", "jerseyNumber": 1, "position": "Goalkeeper" }
      ]
    }
  ],

  "games": [
    { "week": 1, "date": "2026-09-10", "time": "6:15 PM",
      "location": "Field 3", "homeTeam": "Falcons", "awayTeam": "Rovers" },

    { "date": "2026-11-19", "time": "7:00 PM", "location": "Main Field",
      "playoffRound": "semifinal", "homeTeam": "Falcons" }   // awayTeam TBD
  ]
}
```

Jersey numbers must be unique within a team. Leave the field out for an
unassigned number — the column is nullable and the site shows "TBD". The seed
script reports duplicates by name rather than failing with a constraint error.

## Conventions

- **Team identity.** The UI works in slugs (`/teams/falcons`); the database uses
  UUIDs. `lib/supabaseData.ts` translates between them.
- **Game numbers.** Regular season counts from 1, playoffs from 100. The seed
  script and the create-game API both assign these automatically.
- **Playoffs.** `week_number = 0`, `is_playoff = true`, and `playoff_round` set
  to `play-in`, `quarterfinal`, `semifinal` or `final`.
- **League config** is a single row, enforced by a unique index.

## Row Level Security

The anon key can `SELECT` and nothing else. There are deliberately no anon
INSERT/UPDATE/DELETE policies: every write goes through a server route using the
service role key, which bypasses RLS.

If you add a table, give it a public read policy and no write policies, and
write to it from a route handler under `app/api/admin/`.
