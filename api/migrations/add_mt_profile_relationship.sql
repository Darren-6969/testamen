-- Migration: add relationship column to mt_profile
-- Module: Landing page -> Register -> Step 1 "Create a memorial"
--
-- Reason: the registration form collects "This person is my ..." (the legacy PHP
-- active_step_1.php datalist: Mother, Father, ... Friend, Best Friend) but
-- mt_profile has no column to store it. Every other Step 1 field already has a
-- home (fullname, gender, career, born, place_birth, pass_date, pass_location);
-- this is the only gap.
--
-- Nullable on purpose: the legacy PHP field was not required, and ~200 existing
-- mt_profile rows predate this column.
--
-- Width: longest datalist entry is "Sibling of Parent (gender neutral)" (34
-- chars). varchar(100) leaves room and matches the width already used by
-- fullname/career on the same table.
--
-- MIGRATION REQUIRED before Step 1 of the register module can be committed.

ALTER TABLE public.mt_profile
  ADD COLUMN IF NOT EXISTS relationship character varying(100);