-- =====================================================================
-- MIGRATION REQUIRED: Admin (memorial content) module
-- memorial_id across the app = mt_deceased.number_list.
-- =====================================================================

BEGIN;

-- 1) Free tier storage: 0 -> 50 MB (storage_mb is varchar) -------------
UPDATE public.mt_feature SET storage_mb = '50' WHERE feature_plan = 'Free';

-- 2) Tributes (created by visitors on the public page; admin lists/deletes)
CREATE TABLE IF NOT EXISTS public.mt_tribute (
    id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mf_description character varying(1000),
    mf_icon        character varying(255),
    mf_creator     character varying(255),
    mf_date        date,
    mf_time        time without time zone,
    memorial_id    character varying(255),
    deleted_at     timestamp(0) without time zone
);

-- 3) Photos ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mt_photo (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    memorial_id     character varying(10) NOT NULL,
    filename        character varying(255) NOT NULL,
    file_size       integer DEFAULT 0,
    description     character varying(1000),
    uploaded_by     character varying(100),
    approval_status character varying(20) DEFAULT 'approved',  -- pending|approved|rejected
    album_id        integer,
    created_at      timestamp(0) without time zone DEFAULT now(),
    deleted_at      timestamp(0) without time zone
);
CREATE INDEX IF NOT EXISTS idx_photo_memorial ON public.mt_photo (memorial_id);

-- 4) Videos & audios ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mt_video (
    id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    memorial_id     character varying(10) NOT NULL,
    filename        character varying(255) NOT NULL,
    poster          character varying(255),
    media_type      character varying(10) DEFAULT 'video',     -- video|audio
    description     character varying(1000),
    file_size       integer DEFAULT 0,
    uploaded_by     character varying(100),
    approval_status character varying(20) DEFAULT 'approved',
    created_at      timestamp(0) without time zone DEFAULT now(),
    deleted_at      timestamp(0) without time zone
);
CREATE INDEX IF NOT EXISTS idx_video_memorial ON public.mt_video (memorial_id);

-- 5) Per-memorial background images (public page backdrop) -------------
CREATE TABLE IF NOT EXISTS public.mt_memorial_background (
    id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    memorial_id  character varying(10) NOT NULL,
    filename     character varying(255) NOT NULL,
    file_size    integer DEFAULT 0,
    is_active    boolean DEFAULT false,
    created_by   character varying(100),
    created_date date DEFAULT CURRENT_DATE,
    deleted_at   timestamp(0) without time zone
);
CREATE INDEX IF NOT EXISTS idx_bg_memorial ON public.mt_memorial_background (memorial_id);

-- 6) Main Page rich-text stories: add real text columns ---------------
ALTER TABLE public.mt_profile ADD COLUMN IF NOT EXISTS story     text;
ALTER TABLE public.mt_profile ADD COLUMN IF NOT EXISTS our_story text;

COMMIT;