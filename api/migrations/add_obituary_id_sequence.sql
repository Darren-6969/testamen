-- Migration: ensure mt_obituary.id auto-increments
-- Reason: mt_obituary.id is "integer NOT NULL" with no SERIAL/GENERATED default.
-- This is the same missing-sequence bug class already hit on mt_feedback and
-- mt_public_prayer: INSERTs without an explicit id fail. This migration is
-- idempotent and safe to run even if a sequence already exists.
-- MIGRATION REQUIRED before the obituary editor can create new records.
 
CREATE SEQUENCE IF NOT EXISTS mt_obituary_id_seq;
 
-- Point the sequence at the current max id so it won't collide with existing rows.
SELECT setval(
  'mt_obituary_id_seq',
  COALESCE((SELECT MAX(id) FROM public.mt_obituary), 0) + 1,
  false
);
 
ALTER TABLE public.mt_obituary
  ALTER COLUMN id SET DEFAULT nextval('mt_obituary_id_seq');
 
ALTER SEQUENCE mt_obituary_id_seq OWNED BY public.mt_obituary.id;
 