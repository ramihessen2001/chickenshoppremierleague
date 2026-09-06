-- ---------------------------------------------------------------------------
-- Marketing consent
--
-- Recorded on the registration itself, not only in Klaviyo, so the answer to
-- "why is this person on our list" lives in our own database and survives
-- changing provider.
--
-- Defaults to false, and the form ships the box unticked. The registration
-- form promises "We only use your details to run the league", so a marketing
-- list is a separate thing somebody has to actively agree to -- nobody is
-- added because they signed up to play.
--
-- consented_at is kept beside the flag because a bare boolean is not much of a
-- record: what matters later is when they agreed, not just that they did.
-- ---------------------------------------------------------------------------

ALTER TABLE signups
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_consented_at TIMESTAMPTZ;

COMMENT ON COLUMN signups.marketing_opt_in IS
  'Ticked the marketing box at registration. Never set from anything else.';

-- Check: everyone existing is false, which is correct -- none of the 66 were
-- ever asked.
SELECT marketing_opt_in, count(*) FROM signups GROUP BY marketing_opt_in;
