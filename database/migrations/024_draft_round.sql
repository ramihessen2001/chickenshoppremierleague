-- ============================================================================
-- Migration 024 — draft pick and round on players
-- ============================================================================
-- Run this ONCE against a database that already has the players table. A brand
-- new project should run schema.sql instead — it already includes the columns.
--
-- WHY THIS IS COPIED RATHER THAN JOINED
-- ------------------------------------
-- The pick number lives on `signups`, which has no public read policy on
-- purpose — it holds emails and phone numbers. The roster page is public and
-- needs to mark first-round picks, so the two fields it needs are copied here.
--
-- The round is NOT derivable in SQL: clubs can take part in different numbers
-- of rounds (Dakar and Mansoura have six), so the snake's round boundaries
-- move. These values were computed with lib/draft.ts and are written out
-- explicitly rather than recalculated here.
--
-- Players placed on a club rather than picked — captains and pre-draft awards
-- — keep NULL in both columns, which is correct: they had no pick.
--
-- Supabase → SQL Editor → New query → paste → Run.
-- ============================================================================

BEGIN;

ALTER TABLE players
  -- Overall pick, 1..N, matching signups.pick_number.
  ADD COLUMN IF NOT EXISTS draft_pick INTEGER,
  -- Round that pick fell in, 1-indexed.
  ADD COLUMN IF NOT EXISTS draft_round SMALLINT;

COMMENT ON COLUMN players.draft_pick IS
  'Overall draft pick; NULL for a player placed on a club rather than picked.';
COMMENT ON COLUMN players.draft_round IS
  'Round the pick fell in; NULL for a player placed rather than picked. Round 1 is starred on the roster.';

UPDATE players p
   SET draft_pick = v.pick,
       draft_round = v.round
  FROM (VALUES
  ('144d837c-427f-4aae-acd9-b87dc2e6e88c'::uuid, 1, 1)  -- Mohammed amine Bouziane,
  ('4c194086-ebb4-44bf-bf3f-011e11425c8b'::uuid, 2, 1)  -- Uzair Hotak,
  ('85b7bd6a-93b1-4e5a-89c0-f5eac72ee0ba'::uuid, 3, 1)  -- Rakan Muhiar,
  ('4fd8e5d1-3c33-4767-b358-4e87ba95dd34'::uuid, 4, 1)  -- Maher obied,
  ('525fc174-cd43-4b0b-837d-0a7e3d92ad2e'::uuid, 5, 1)  -- Taha Elakhtaby,
  ('a982c418-125e-41b7-b49e-f4e289485ff6'::uuid, 6, 1)  -- Ahmed khater,
  ('0d3cc15c-1a03-4e31-80e6-168bd1fa3197'::uuid, 7, 1)  -- Obadah,
  ('11698e52-8545-4a01-a4fb-92a64fb8169d'::uuid, 8, 1)  -- Mahmoud Tarek,
  ('d40ce64f-b6eb-43ba-b7fa-a726e3e11cc2'::uuid, 9, 2)  -- Thehsh,
  ('19c0eda7-ca6a-46a6-b4db-7a6714acda79'::uuid, 10, 2)  -- Husam Abusahloul,
  ('8a59e418-7029-4a6d-ba9a-8b72e20278c2'::uuid, 11, 2)  -- Yassin Elakhtaby,
  ('754026dd-177f-4da2-8446-ccbc09f73308'::uuid, 12, 2)  -- Mohammad Khriwesh,
  ('90cde47f-1803-4e56-a5c5-c1363bbda2fa'::uuid, 13, 2)  -- Mohammad Nabaout,
  ('f1856ccf-694c-4538-90ae-6f86ffaf2bdf'::uuid, 14, 2)  -- Rizgar Rashid,
  ('e2568340-d9f2-44c6-a8c4-228be371de22'::uuid, 15, 2)  -- Momen,
  ('43288951-f7ac-499d-9440-6ef70d3e14af'::uuid, 16, 2)  -- Gaibrial Mohammed Wood,
  ('4cdb26fa-7339-4fdc-96c3-ad54e47977da'::uuid, 17, 3)  -- Mohammad Elyas Mohammadi,
  ('87f7b764-8a6c-472d-b0c6-1fb5ede40c3f'::uuid, 18, 3)  -- Muslim Achabak,
  ('f5b775fb-aa3a-4040-b5b3-1b1fdbaa67ca'::uuid, 19, 3)  -- Habibullah,
  ('55d7cff0-967a-4b3e-925a-bb72052c38c0'::uuid, 20, 3)  -- Hesham helmy,
  ('8bc637c9-2fa2-4a8a-bdc4-ebf6b5a2735a'::uuid, 21, 3)  -- Karim Ashmawy,
  ('40ae3cac-2a17-4d81-b3c7-d08b8ef0c586'::uuid, 22, 3)  -- Moussa Wood,
  ('36f0af48-4c28-4e77-8156-7fe2376d459e'::uuid, 23, 3)  -- Yousif Abed Radhi,
  ('4ec5c682-b7b5-42c2-8c35-8874b1b8ddb4'::uuid, 24, 3)  -- Ömer Dur,
  ('9ab98b8c-6c57-4b2d-a847-fb841745b7a4'::uuid, 25, 4)  -- Thuan Nguyen,
  ('2f9d92b3-d9f0-4683-b031-949e2f0276d1'::uuid, 26, 4)  -- Elyas Elahi,
  ('2756bfac-b2bb-4674-a66b-e90d6d015505'::uuid, 27, 4)  -- Walid,
  ('70efa23c-177c-49b3-9182-444170b12c65'::uuid, 28, 4)  -- Mohamed Alhawayan,
  ('86ca9425-2bba-4778-86d8-f5b3d16ae8ed'::uuid, 29, 4)  -- Aref Nawabi,
  ('e5c9771b-4ffa-4dbe-84f4-f9f48c63d635'::uuid, 30, 4)  -- Ahmad Ebadi,
  ('36eee688-6500-4c88-955a-8f56f81d0d89'::uuid, 31, 4)  -- Hamza Alemam,
  ('a288a07f-16fe-40a7-a687-96957485459d'::uuid, 32, 4)  -- Eyad Elmagany,
  ('0a6e13a4-1740-47d7-92f9-67643ef08356'::uuid, 33, 5)  -- Mohamed Bekheet,
  ('dc0932fd-f3b5-4f4b-b9b7-de5a621a94d3'::uuid, 34, 5)  -- Marouf Nawabi,
  ('2d6a8113-5b86-4f09-8a08-bd7554bbbe87'::uuid, 35, 5)  -- Rashed,
  ('12248ac5-77f1-49cb-909b-1e2d50fc8187'::uuid, 36, 5)  -- khaled hussein,
  ('bc1ec619-52ae-4908-9ef4-5d7d68446a5b'::uuid, 37, 5)  -- Yassen Hamed,
  ('1c75a58c-d98b-419d-8282-ec7e608e88dc'::uuid, 38, 5)  -- Hasibullah,
  ('338e13e5-dddb-4445-a0e4-0d0cd9b61ec8'::uuid, 39, 5)  -- Adnane,
  ('3711be30-ab22-4d5c-97bf-1a93f25ac3c8'::uuid, 40, 5)  -- Ali,
  ('bfd1ad67-b8a5-4d0c-bb8b-e59450b3b611'::uuid, 41, 6)  -- Sayed ferdaws,
  ('7fddb859-427b-42c5-a318-f47fe2b14da7'::uuid, 42, 6)  -- Selim,
  ('d79d9d88-a91e-4ee5-8216-f411857b0477'::uuid, 43, 6)  -- ismaela willane,
  ('af3084c2-b003-4bb7-9c12-212b608f032d'::uuid, 44, 6)  -- Ibrahim Rashid,
  ('ea561456-0e02-4c13-b06f-41fe659be5a8'::uuid, 45, 6)  -- Adam abu maali,
  ('1f33ec53-05f8-45b0-9c40-19ec41dd4189'::uuid, 46, 6)  -- Yousif Ali,
  ('51b45b0c-81c7-40e1-92cc-10d71a2e77c4'::uuid, 47, 6)  -- Shahene Abdelkarim,
  ('7ee63e80-20b9-442d-abf3-df89d8375467'::uuid, 48, 6)  -- Yoseph Badr,
  ('33ea5fc7-2a8b-4734-9572-c5da7d09703d'::uuid, 49, 7)  -- Abdelmajid Guissou,
  ('eb9b923c-4017-4737-8fe8-60e47388fc7c'::uuid, 50, 7)  -- adil kedir,
  ('1467b11b-efaa-4ff2-80cb-7bc3c747ec15'::uuid, 51, 7)  -- Alind Zakholi,
  ('836d2925-2e64-4d9f-b4af-b0e88634ae66'::uuid, 52, 7)  -- Ezzaldin Shammout,
  ('f5347dfc-51f0-41e7-a98e-b31d1dfca0d2'::uuid, 53, 7)  -- Abdurrazzaaq IbnMichael Abdullah,
  ('c5174099-b616-482d-b856-2ee3cdb1d6e0'::uuid, 54, 7)  -- Omar Ali
  ) AS v(player_id, pick, round)
 WHERE p.id = v.player_id;

COMMIT;

-- ---------------------------------------------------------------------------
-- Verify — expect 54 picked, 8 of them in round one, 13 placed without a pick.
-- ---------------------------------------------------------------------------
-- SELECT count(*) FILTER (WHERE draft_round IS NOT NULL) AS picked,
--        count(*) FILTER (WHERE draft_round = 1)         AS first_round,
--        count(*) FILTER (WHERE draft_round IS NULL)     AS placed
--   FROM players;
