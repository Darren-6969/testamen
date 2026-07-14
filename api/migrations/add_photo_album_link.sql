-- =====================================================================
-- MIGRATION REQUIRED: album <-> photo many-to-many link
-- Lets a photo belong to multiple albums while still showing in Photos.
-- Run once. Safe to re-run.
-- =====================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.mt_album_photo (
    id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    album_id integer NOT NULL,
    photo_id integer NOT NULL,
    UNIQUE (album_id, photo_id)
);

-- carry over existing single-album assignments (mt_photo.album_id) into the link
INSERT INTO public.mt_album_photo (album_id, photo_id)
SELECT album_id, id
FROM public.mt_photo
WHERE album_id IS NOT NULL
ON CONFLICT (album_id, photo_id) DO NOTHING;

-- mt_photo.album_id is now legacy (membership lives in mt_album_photo).
-- Left in place for reference; safe to drop later once confirmed.

COMMIT;