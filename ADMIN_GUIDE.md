# Admin guide

## Signing in

Click **ADMIN** in the footer and enter the password. A session lasts 12 hours,
after which you will be asked again. Use **Exit Admin Mode** in the orange
banner to sign out early.

The password is set by the `ADMIN_PASSWORD` environment variable and is checked
on the server. If you need to change it, change that variable and redeploy —
everyone signed in stays signed in until their session expires. To sign everyone
out immediately, change `ADMIN_SESSION_SECRET` instead.

---

## Running a season

### Before week 1

1. Add the teams and players (see `database/README.md`, or the Supabase table
   editor).
2. Add the fixtures — either in `database/seed-data.json` before seeding, or
   game by game with **Add Game** on the schedule page.
3. Set the season label, start and end dates, and week count on the
   `league_config` row in Supabase.

### Each week

Use the admin panel at the top of the homepage to move **current week** forward.
That controls which fixtures the homepage features; it does not change any game
data.

After each game, open its card and click the pencil icon:

- **Add Statistic** for each goal, assist, save or card. Pick the player, the
  type, and a count (2 if they scored twice).
- The score is calculated from the goals you enter, so you do not type it in —
  this is deliberate, so the score line and the scorer list can never disagree.
- Pick the man of the match from the dropdown.
- **Save Changes** writes the scores, statistics and man of the match together.

Saving replaces all of that game's statistics with what is on screen, so edit
the full list rather than expecting to append to it.

### Playoffs

1. Add the playoff games with **Add Game**, ticking **This is a playoff game**
   and choosing the round. Leave a team blank for a slot that is not decided
   yet ("winner of the play-in").
2. On the homepage admin panel, click **Start playoffs**. The homepage switches
   from weekly fixtures to the bracket and the championship card.
3. As results come in, edit each playoff game and fill in the next round's
   teams.

The championship card appears once a game with round **final** exists, and shows
the winner as champions once that game is marked completed.

---

## Rosters

Open a team page. In admin mode each player card gets edit and delete buttons,
and there is an **Add Player** button in the header.

Jersey numbers must be unique within a team. Leave the number blank for a player
who has not been given one — they show as "TBD" and sort to the bottom.

Deleting a player also deletes their statistics. There is no undo.

---

## Standings

Standings are an uploaded image, not a computed table. Go to **Standings** and
use the upload box (admin only). PNG, JPEG or WebP, up to 5MB. Uploading a new
image replaces the one on display.

---

## Awards

Go to **Player Stats**. In admin mode you get the award management panel:

- **Create award** — name and description. The current season is attached
  automatically.
- **Manage nominees** — add the players up for it.
- **Active** — only active awards accept votes. Untick to close voting.
- **View results** — vote counts plus the names voters gave.

Visitors see the voting panel instead. One vote per award per browser, enforced
by the database. Someone determined to vote twice can clear their browser
storage and do so; if that matters, close voting once you have enough responses.

---

## Notes

- Everything you change saves to the database and is visible to everyone
  immediately. There is no draft or preview mode.
- Admin controls that appear without a valid session will fail with "Your admin
  session has expired" — log in again.
- If a save fails, the error shown is the real reason from the server. A
  duplicate jersey number and an expired session look different on purpose.
