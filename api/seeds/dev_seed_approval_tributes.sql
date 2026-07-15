-- =====================================================================
-- DEV SEED -- NOT A MIGRATION. Do not run in production.
-- Creates test data for the Admin > Approval and Tributes tabs, which
-- normally get their rows from the public visitor page (not built yet).
--
-- HOW TO USE: replace MEMORIAL_ID below with your mt_deceased.number_list
-- value, then run the section you need in pgAdmin / DBeaver.
--
-- IMPORTANT: memorial_id = mt_deceased.number_list -- NOT the number_list or
-- memorial_id columns on mt_user_account (those are unrelated legacy fields).
-- Find the right value with your account's code_no:
--
--   SELECT number_list, name FROM mt_deceased WHERE code_no = '1092087149730';
--
-- If the account owns several memorials, seed the one currently selected in
-- the dashboard's memorial picker (the tab reads activeMemorial.numberList).
-- =====================================================================

\set memorial '''MEMORIAL_ID'''
-- If your client doesn't support \set (pgAdmin does not), just find/replace
-- :memorial with 'YOUR_ID' throughout this file.


-- ---------------------------------------------------------------------
-- A) Approval tab: pretend a friend uploaded some media awaiting review.
--    Flips your 3 most recent approved photos to 'pending'.
--    They vanish from Photos & Albums and appear in Approval.
-- ---------------------------------------------------------------------
UPDATE mt_photo
   SET approval_status = 'pending',
       uploaded_by     = 'Jane Tan (friend)'
 WHERE id IN (
   SELECT id FROM mt_photo
    WHERE memorial_id = '1'
      AND deleted_at IS NULL
      AND approval_status = 'approved'
    ORDER BY id DESC
    LIMIT 3
 );

UPDATE mt_video
   SET approval_status = 'pending',
       uploaded_by     = 'Ah Meng (cousin)'
 WHERE id IN (
   SELECT id FROM mt_video
    WHERE memorial_id = '1'
      AND deleted_at IS NULL
      AND approval_status = 'approved'
    ORDER BY id DESC
    LIMIT 2
 );

-- Check what's now pending:
-- SELECT id, filename, media_type, approval_status, uploaded_by FROM mt_video WHERE memorial_id = :memorial;


-- ---------------------------------------------------------------------
-- B) Tributes tab: insert sample tributes.
--    (id is GENERATED ALWAYS AS IDENTITY -- never supply it.)
-- ---------------------------------------------------------------------
INSERT INTO mt_tribute (memorial_id, mf_creator, mf_description, mf_date, mf_time)
SELECT v.* FROM (VALUES
    ('1', 'Jane Tan',    'Thank you for every kindness you showed our family. You will be dearly missed.', CURRENT_DATE,     CURRENT_TIME),
    ('1', 'Ah Meng',     'Rest well, old friend. Still remember our kopi sessions every Sunday morning.',   CURRENT_DATE - 1, CURRENT_TIME),
    ('1', 'Siti Aminah', 'A wonderful neighbour and an even better person. Deepest condolences.',           CURRENT_DATE - 3, CURRENT_TIME),
    ('1', 'David Lim',   'Uncle always had a story ready. Our thoughts are with the family.',               CURRENT_DATE - 7, CURRENT_TIME)
  ) AS v(memorial_id, mf_creator, mf_description, mf_date, mf_time)
 WHERE NOT EXISTS (
   SELECT 1 FROM mt_tribute t
    WHERE t.memorial_id = v.memorial_id AND t.mf_creator = v.mf_creator AND t.deleted_at IS NULL
 );

-- =====================================================================
-- RESET / CLEANUP -- run these to undo the above.
-- =====================================================================

-- Put pending items back to approved (they reappear in Photos / Videos):
-- UPDATE mt_photo SET approval_status = 'approved' WHERE memorial_id = :memorial AND approval_status = 'pending';
-- UPDATE mt_video SET approval_status = 'approved' WHERE memorial_id = :memorial AND approval_status = 'pending';

-- Undo rejections (reject sets BOTH approval_status and deleted_at):
-- UPDATE mt_photo SET approval_status = 'approved', deleted_at = NULL WHERE memorial_id = :memorial AND approval_status = 'rejected';
-- UPDATE mt_video SET approval_status = 'approved', deleted_at = NULL WHERE memorial_id = :memorial AND approval_status = 'rejected';

-- Remove seeded tributes:
-- DELETE FROM mt_tribute WHERE memorial_id = :memorial AND mf_creator IN ('Jane Tan','Ah Meng','Siti Aminah','David Lim');