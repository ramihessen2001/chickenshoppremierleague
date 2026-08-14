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

## Registrations

**Signups** in the header, while signed in. The heading line tells you how many
have registered, how many places are confirmed against the cap of 64, and how
many have not paid.

### Taking the fee

Registering does not hold a place — paying does. When a payment lands, find the
player and pick how it arrived from **Mark paid…**. That stamps the date and
the method, so an unexplained Venmo transfer can be matched to a name later.
Picked the wrong person? **Mark unpaid** clears both.

Filter by **Unpaid** to see who still owes. Withdrawn players are left out of
that list.

### Kit

Every registration carries a jersey name, a requested number and a size, shown
on the row as `Kit: AHMED #7 · L` and included in the CSV export. The number is
a request, not a reservation — squad numbers have to be unique within a team, so
clashes are settled on the roster after the draft.

For the size tally, run this in Supabase → SQL Editor:

```sql
SELECT jersey_size, COUNT(*) FROM signups
  WHERE status = 'confirmed' GROUP BY jersey_size ORDER BY jersey_size;
```

### Confirming a place

Set their status to **Confirmed**. This is the step that emails the player to
say their place is secured, and it only sends on the change itself — later
edits to a confirmed player send nothing. Paying and confirming are separate on
purpose: you might confirm someone who paid in cash at the masjid, or hold a
payment you have not verified yet.

### The roster cap

The league has room for 64 **confirmed** players. Registrations keep arriving
past that point, but they come in as **Waitlisted** and those players are told
not to send the fee. Confirming a 65th player is still possible — you get a
warning first. The cap lives in `config/league.ts` if the number changes.

---

## Questions

**Inbox** in the header holds everything sent through the contact form. It
opens on the unanswered ones.

**Reply** opens your own mail client with the question quoted, so the answer
comes from a real address rather than the site. Then **Mark answered** to clear
it off the list. Nothing is sent by the site here.

---

## Notes

- Everything you change saves to the database and is visible to everyone
  immediately. There is no draft or preview mode.
- Admin controls that appear without a valid session will fail with "Your admin
  session has expired" — log in again.
- If a save fails, the error shown is the real reason from the server. A
  duplicate jersey number and an expired session look different on purpose.
