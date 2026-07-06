-- Add auto-increment sequence to mt_feedback.id
--
-- mt_feedback.id is a plain integer column with NO sequence/default configured
-- (confirmed against the current postgres_database.backup — unlike e.g. mt_incident,
-- which already has mt_incident_id_seq). This means inserts must currently supply
-- `id` manually, which is fragile under concurrent writes.
--
-- This migration creates a sequence, fast-forwards it past the current max id
-- (so it never collides with existing rows), and wires it up as the column default
-- so plain `INSERT ... RETURNING id` works from now on, same as mt_incident.
--
-- Safe to run once against the existing database.

CREATE SEQUENCE IF NOT EXISTS mt_feedback_id_seq
    OWNED BY mt_feedback.id;

SELECT setval(
    'mt_feedback_id_seq',
    COALESCE((SELECT MAX(id) FROM mt_feedback), 0) + 1,
    false
);

ALTER TABLE mt_feedback
    ALTER COLUMN id SET DEFAULT nextval('mt_feedback_id_seq');