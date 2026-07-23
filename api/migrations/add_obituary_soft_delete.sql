-- Migration: add soft-delete columns to mt_obituary
-- Module: Obituary
--
-- Fixes: ERROR 42703 column "is_active" does not exist
--        (obituaryController.getObituaryByMemorial and five other queries)
--
-- Cause: the obituary module implements soft delete against three columns that
-- were never added to the schema. deleteObituary does
--   UPDATE mt_obituary SET is_active = false, deleted_at = NOW(), deleted_by = $1
-- and six SELECTs filter on `is_active = true`, but mt_obituary declares none of
-- them. Confirmed against memodise_postgresql_backup4.backup: the table has
-- id, mf_id, code_no, md_content ... pdf_name, number_list and nothing else.
-- No migration in api/migrations/ creates them either.
--
-- If this module worked previously, the columns were almost certainly added by
-- hand on that database and lost when it was restored from a backup. This
-- migration makes them reproducible.
--
-- Types follow the existing conventions:
--   deleted_at  timestamp(0) — same as mt_photo, mt_video, mt_public_prayer
--   deleted_by  varchar(10)  — deleteObituary writes String(userId).slice(0, 10)
--   is_active   boolean DEFAULT true — existing rows become active, so nothing
--               currently visible disappears
--
-- MIGRATION REQUIRED before the obituary editor will load.

ALTER TABLE public.mt_obituary
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS deleted_at timestamp(0) without time zone,
  ADD COLUMN IF NOT EXISTS deleted_by character varying(10);

-- Belt and braces: ADD COLUMN ... DEFAULT backfills existing rows on modern
-- Postgres, but an is_active of NULL would fail `WHERE is_active = true` and
-- silently hide the obituary rather than erroring.
UPDATE public.mt_obituary
   SET is_active = true
 WHERE is_active IS NULL;