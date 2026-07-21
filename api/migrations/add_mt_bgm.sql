-- add_bgm_library.sql
-- Global background-music library for the Admin module Main Page "Background music" field.
--
-- The customer side reads active rows (is_active = TRUE) to populate the dropdown;
-- mt_profile.music stores the chosen row's `filename`. Audio files live on disk at
-- uploads/memorial/music/<filename> and are served at /api/uploads/memorial/music/<filename>.
--
-- This is a shared catalogue, NOT per-memorial. Admin-side BGM management
-- (insert/edit/hide) is out of scope for now; new tracks can be added later by
-- inserting a row here and copying the audio file to disk -- no code change needed.

CREATE TABLE IF NOT EXISTS public.mt_bgm (
    id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       character varying(150) NOT NULL,          -- dropdown label, e.g. "Peaceful Piano"
    filename    character varying(255) NOT NULL UNIQUE,    -- file on disk under uploads/memorial/music/
    artist      character varying(150),                    -- optional credit / attribution
    is_active   boolean DEFAULT TRUE,                      -- show/hide in the customer dropdown
    sort_order  integer DEFAULT 0,                         -- dropdown ordering (ascending)
    created_at  timestamp(0) without time zone DEFAULT now()
);

-- Fast fetch of the visible library in display order.
CREATE INDEX IF NOT EXISTS idx_bgm_active ON public.mt_bgm (is_active, sort_order);

-- Tracks are inserted later, once the audio files are chosen. Example (for reference):
-- INSERT INTO public.mt_bgm (title, filename, artist, sort_order) VALUES
--   ('Peaceful Piano', 'peaceful-piano.mp3', 'Some Artist', 1);