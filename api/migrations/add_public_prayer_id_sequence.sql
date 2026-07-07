-- Add auto-increment sequence to mt_public_prayer.id
--
-- mt_public_prayer.id is a plain integer column with NO sequence/default configured
-- (confirmed against the current postgres_database.backup). This means inserts
-- currently fail with a NOT-NULL violation, since createPublicPrayer's INSERT
-- never supplies `id`.
--
-- This migration creates a sequence, fast-forwards it past the current max id
-- (so it never collides with existing rows), and wires it up as the column default
-- so plain `INSERT ... RETURNING id` works from now on, same as mt_incident and
-- mt_feedback.
--
-- Safe to run once against the existing database.

CREATE SEQUENCE IF NOT EXISTS mt_public_prayer_id_seq
    OWNED BY mt_public_prayer.id;

SELECT setval(
    'mt_public_prayer_id_seq',
    COALESCE((SELECT MAX(id) FROM mt_public_prayer), 0) + 1,
    false
);

ALTER TABLE mt_public_prayer
    ALTER COLUMN id SET DEFAULT nextval('mt_public_prayer_id_seq');