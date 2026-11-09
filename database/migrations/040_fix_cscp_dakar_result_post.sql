-- ---------------------------------------------------------------------------
-- Commissioner's board: CSCP v S.C Dakar (Matchweek 4) result post
--
-- The full-time post is written once, the first time a game's box score is
-- saved as completed (lib/boxScore.ts). This game was first saved as completed
-- before its score and goals were in, so the post read "0-0" with no scorers.
-- The game itself finished 1-10.
--
-- This rewrites that one post with the real result, in the same wording the
-- site uses for every result (lib/resultAnnouncement.ts). Its date and place
-- in the feed stay the same. Safe to run twice.
-- ---------------------------------------------------------------------------

UPDATE commissioner_posts
SET body = $post$⏱️ FULL-TIME: CSCP 1-10 S.C DAKAR

CENTRAL SPORTING CLUB OF PURO (CSCP) v S.C DAKAR finishes 1-10.

⚽ Khriwesh (CSCP) · Rakan Muhiar x3, Hamza H. Abdushaheed x2, Yaseen Jawhar x2, Ahmad Ebadi, Rashed, Rizgar Rashid (S.C DAKAR)

Man of the match: Hamza H. Abdushaheed.

Full time. ✅$post$,
    updated_at = NOW()
WHERE id = '47c73d70-5085-4bf9-9e4c-a4fc2394026f';

SELECT created_at, body
FROM commissioner_posts
WHERE id = '47c73d70-5085-4bf9-9e4c-a4fc2394026f';
