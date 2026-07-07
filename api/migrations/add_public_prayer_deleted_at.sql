-- Convert mt_public_prayer delete behavior from hard delete to soft delete
--
-- Follows the same deleted_at convention already used by payment_items and
-- payment_pending. Nullable timestamp; NULL means active, non-NULL means
-- soft-deleted. No default — existing rows will have deleted_at = NULL,
-- i.e. they remain visible.
--
-- Safe to run once against the existing database.

ALTER TABLE mt_public_prayer
    ADD COLUMN IF NOT EXISTS deleted_at timestamp(0) without time zone;