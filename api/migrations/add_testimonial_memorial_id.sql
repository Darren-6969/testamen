-- Migration: add missing memorial_id column to mt_testimonial
-- Reason: mt_testimonial has no FK back to the memorial it belongs to.
-- Every sibling content table (mt_album, mt_obituary, mt_love_giving) already
-- uses memorial_id varchar(10) referencing mt_deceased.number_list, so this
-- brings mt_testimonial in line with that existing convention.
-- MIGRATION REQUIRED before the dashboard "Tributes" stat will return correct
-- per-memorial counts.

ALTER TABLE public.mt_testimonial
  ADD COLUMN IF NOT EXISTS memorial_id character varying(10);

CREATE INDEX IF NOT EXISTS idx_mt_testimonial_memorial_id
  ON public.mt_testimonial (memorial_id);