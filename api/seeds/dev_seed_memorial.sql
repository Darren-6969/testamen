-- =====================================================================
-- DEV SEED -- NOT A MIGRATION. Do not run in production.
--
-- Creates 3 test memorials owned by mt_user_account.id = 46, so the
-- dashboard's My Memorials rail has enough cards to exercise the
-- 3-across + horizontal scroll behaviour.
--
-- WHY THREE TABLES:
--   mt_deceased  -- the memorial itself (name, url, ownership via code_no)
--   mt_obituary  -- the dashboard card reads Date of Departure and Place of
--                   Rest from HERE (o.mf_pass_date / o.mf_pass_location via
--                   the LEFT JOIN LATERAL in customerDashboardController),
--                   NOT from mt_profile. Without this row both fields render
--                   as an em dash.
--   mt_profile   -- what the Admin module reads. Seeded so the memorials are
--                   editable there too, not just visible on the dashboard.
--
-- OWNERSHIP: the dashboard scopes with `WHERE d.code_no = req.user.codeNo`,
-- so what actually binds a memorial to account 46 is mt_deceased.code_no
-- matching mt_user_account.code_no -- not the id. This script looks the
-- code_no up rather than hardcoding it.
--
-- IDs ARE ASSIGNED BY HAND: mt_deceased and mt_profile have no id sequence
-- (only mt_feedback, mt_obituary and mt_public_prayer got one). This mirrors
-- adminProfileController's own COALESCE(MAX(id),0)+1 pattern.
--
-- SAFE TO RE-RUN: skips any memorial whose number_list already exists.
-- TO REMOVE: see the cleanup block at the bottom of this file.
-- =====================================================================

BEGIN;

DO $$
DECLARE
  -- Change this one value to seed a different account.
  v_account_id integer := 46;

  v_code_no    varchar(255);
  v_email      varchar(255);
  v_next_dec   integer;
  v_next_obit  integer;
  v_next_prof  integer;
  r            record;
  v_created    integer := 0;
BEGIN
  SELECT code_no, COALESCE(NULLIF(email, ''), username)
    INTO v_code_no, v_email
    FROM mt_user_account
   WHERE id = v_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No mt_user_account row with id = %. Nothing seeded.', v_account_id;
  END IF;

  -- A null code_no would insert memorials that no account can ever see.
  IF v_code_no IS NULL OR btrim(v_code_no) = '' THEN
    RAISE EXCEPTION
      'Account % has no code_no. The dashboard scopes memorials by code_no, so these rows would be invisible.',
      v_account_id;
  END IF;

  RAISE NOTICE 'Seeding memorials for account id=% (code_no=%)', v_account_id, v_code_no;

  SELECT COALESCE(MAX(id), 0) INTO v_next_dec  FROM mt_deceased;
  SELECT COALESCE(MAX(id), 0) INTO v_next_obit FROM mt_obituary;
  SELECT COALESCE(MAX(id), 0) INTO v_next_prof FROM mt_profile;

  FOR r IN
    SELECT * FROM (VALUES
      ('TEST01', 'test-lim-chee-keong', 'Lim Chee Keong',
       'Male',   DATE '1948-03-12', DATE '2026-01-08',
       'Nirvana Memorial Park, Semenyih', 'Kuala Lumpur', 'Retired schoolteacher'),

      ('TEST02', 'test-siti-aminah', 'Siti Aminah binti Yusof',
       'Female', DATE '1955-11-02', DATE '2026-02-19',
       'Taman Selatan Muslim Cemetery, Cheras', 'Melaka', 'Staff nurse'),

      ('TEST03', 'test-r-manickam', 'R. Manickam a/l Suppiah',
       'Male',   DATE '1941-06-25', DATE '2025-12-30',
       'Kwong Tong Cemetery, Kuala Lumpur', 'Ipoh, Perak', 'Railway engineer')

      -- ---------------------------------------------------------------
      -- The rail shows 3 across and only scrolls at MORE than 3 cards, so
      -- three memorials fills the row exactly and nothing scrolls. If
      -- account 46 has no memorials of its own, uncomment the two rows
      -- below to get 5 and actually exercise the scroll + arrow buttons.
      --
      -- Strip the leading "-- " from those 6 lines and change nothing else:
      -- the commas are already positioned (leading-comma style), so do NOT
      -- add one after the TEST03 row above.
      -- ---------------------------------------------------------------
      -- ,('TEST04', 'test-goh-mei-ling', 'Goh Mei Ling',
      --  'Female', DATE '1962-09-14', DATE '2026-03-05',
      --  'Nilai Memorial Park, Negeri Sembilan', 'Penang', 'Textile trader')
      -- ,('TEST05', 'test-anthony-fernandez', 'Anthony Fernandez',
      --  'Male',   DATE '1950-01-30', DATE '2026-04-11',
      --  'Cheras Christian Cemetery, Kuala Lumpur', 'Malacca', 'Civil servant')
    ) AS t(number_list, url_name, full_name, gender,
           born, pass_date, pass_location, place_birth, career)
  LOOP
    IF EXISTS (SELECT 1 FROM mt_deceased WHERE number_list = r.number_list) THEN
      RAISE NOTICE '  skipping % -- number_list already exists', r.number_list;
      CONTINUE;
    END IF;

    v_next_dec := v_next_dec + 1;
    INSERT INTO mt_deceased
      (id, code_no, url_name, status, memorial_name,
       register_date, number_list, gender, registered_account, show)
    VALUES
      (v_next_dec, v_code_no, r.url_name, 'Active', r.full_name,
       CURRENT_DATE, r.number_list, r.gender, v_email, TRUE);

    -- Drives the dashboard card's Date of Departure / Place of Rest.
    -- mf_img stays NULL: there's no uploaded file to point at, so the card
    -- falls back to the grey User placeholder icon. Expected, not a bug.
    -- number_list mirrors memorial_id, matching obituaryController's insert.
    v_next_obit := v_next_obit + 1;
    INSERT INTO mt_obituary
      (id, code_no, mf_img, mf_fullname, mf_born, mf_pass_date,
       "mf-born_location", mf_pass_location, mf_theme,
       memorial_id, number_list, create_by, create_date, create_time)
    VALUES
      (v_next_obit, v_code_no, NULL, r.full_name, r.born, r.pass_date,
       r.place_birth, r.pass_location, 'd1',
       r.number_list, r.number_list, v_account_id::text, CURRENT_DATE,
       -- create_time is varchar(10); a full timestamp overflows it.
       to_char(NOW(), 'HH24:MI:SS'));

    -- acc_id = mt_user_account.id (the creator), per adminProfileController.
    v_next_prof := v_next_prof + 1;
    INSERT INTO mt_profile
      (id, acc_id, code_no, memorial_id, fullname, gender, career,
       born, pass_date, pass_location, place_birth, last_modified_date)
    VALUES
      (v_next_prof, v_account_id::text, v_code_no, r.number_list, r.full_name,
       r.gender, r.career, r.born, r.pass_date, r.pass_location,
       r.place_birth, CURRENT_DATE);

    v_created := v_created + 1;
    RAISE NOTICE '  created % -- %', r.number_list, r.full_name;
  END LOOP;

  -- mt_obituary DOES have a sequence, but the inserts above set id explicitly,
  -- which leaves nextval() behind and would collide on the next app-created
  -- obituary. Push it past the highest id.
  IF to_regclass('public.mt_obituary_id_seq') IS NOT NULL THEN
    PERFORM setval('public.mt_obituary_id_seq',
                   GREATEST((SELECT COALESCE(MAX(id), 0) FROM mt_obituary), 1));
  END IF;

  RAISE NOTICE 'Done. % memorial(s) created.', v_created;
END $$;

COMMIT;


-- ---------------------------------------------------------------------
-- VERIFY: should return the 3 memorials with departure date + place of rest.
-- ---------------------------------------------------------------------
SELECT d.number_list,
       d.memorial_name,
       o.mf_pass_date     AS date_of_departure,
       o.mf_pass_location AS place_of_rest
  FROM mt_deceased d
  LEFT JOIN mt_obituary o ON o.memorial_id = d.number_list
 WHERE d.code_no = (SELECT code_no FROM mt_user_account WHERE id = 46)
   AND d.show = TRUE
 ORDER BY d.number_list;


-- ---------------------------------------------------------------------
-- CLEANUP: removes ONLY these three seeded memorials. Run when done.
-- ---------------------------------------------------------------------
-- BEGIN;
-- DELETE FROM mt_profile  WHERE memorial_id IN ('TEST01','TEST02','TEST03','TEST04','TEST05');
-- DELETE FROM mt_obituary WHERE memorial_id IN ('TEST01','TEST02','TEST03','TEST04','TEST05');
-- DELETE FROM mt_deceased WHERE number_list IN ('TEST01','TEST02','TEST03','TEST04','TEST05');
-- COMMIT;