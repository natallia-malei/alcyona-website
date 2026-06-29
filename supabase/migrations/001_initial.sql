-- Alcyona — initial schema
-- Apply in Supabase Dashboard → SQL Editor → Run

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE releases (
  id TEXT PRIMARY KEY,                    -- slug, e.g. "starfall"
  title JSONB NOT NULL,                   -- { ru, en }
  type TEXT NOT NULL CHECK (type IN ('album', 'single', 'ep')),
  release_date DATE NOT NULL,
  cover_url TEXT NOT NULL,
  description JSONB NOT NULL,             -- { ru, en }
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  links JSONB NOT NULL DEFAULT '{}'::jsonb,   -- { spotify?, appleMusic?, youtube? }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_releases_featured ON releases (is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_releases_date ON releases (release_date DESC);

CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title JSONB NOT NULL,
  duration_sec INTEGER NOT NULL,
  lyrics JSONB,                           -- nullable
  UNIQUE (release_id, position)
);

CREATE INDEX idx_tracks_release ON tracks (release_id, position);

CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_position ON photos (position);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT NOT NULL,
  title JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_videos_position ON videos (position);

CREATE TABLE band_info (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  booking_email TEXT NOT NULL,
  telegram_channel TEXT NOT NULL,
  social JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { instagram?, youtube?, vk?, telegram? }
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE releases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_info ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can SELECT)
CREATE POLICY "Public read releases"  ON releases  FOR SELECT USING (true);
CREATE POLICY "Public read tracks"    ON tracks    FOR SELECT USING (true);
CREATE POLICY "Public read photos"    ON photos    FOR SELECT USING (true);
CREATE POLICY "Public read videos"    ON videos    FOR SELECT USING (true);
CREATE POLICY "Public read band_info" ON band_info FOR SELECT USING (true);

-- Authenticated write access (INSERT/UPDATE/DELETE)
CREATE POLICY "Auth write releases"  ON releases  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write tracks"    ON tracks    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write photos"    ON photos    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write videos"    ON videos    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write band_info" ON band_info FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO band_info (id, booking_email, telegram_channel, social) VALUES (
  1,
  'alcyona@gmail.com',
  'https://t.me/alcyona',
  '{"instagram":"https://instagram.com/alcyona","youtube":"https://youtube.com/@alcyona","vk":"https://vk.com/alcyona","telegram":"https://t.me/alcyona"}'::jsonb
);

INSERT INTO releases (id, title, type, release_date, cover_url, description, is_featured, links) VALUES
(
  'starfall',
  '{"ru":"Звездопад","en":"Starfall"}'::jsonb,
  'album',
  '2026-05-01',
  'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=900&q=80',
  '{"ru":"Дебютный альбом ALCYONA — путешествие сквозь свет и тьму.","en":"ALCYONA''s debut album — a journey through light and darkness."}'::jsonb,
  TRUE,
  '{"spotify":"https://open.spotify.com/","appleMusic":"https://music.apple.com/","youtube":"https://youtube.com/"}'::jsonb
),
(
  'echoes',
  '{"ru":"Эхо","en":"Echoes"}'::jsonb,
  'single',
  '2025-11-12',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900&q=80',
  '{"ru":"Сингл, открывший новую главу звучания группы.","en":"The single that opened a new chapter in the band''s sound."}'::jsonb,
  FALSE,
  '{"spotify":"https://open.spotify.com/"}'::jsonb
);

INSERT INTO tracks (release_id, position, title, duration_sec, lyrics) VALUES
('starfall', 1,
  '{"ru":"Пролог","en":"Prologue"}'::jsonb, 92,
  '{"ru":"Здесь начнётся история...","en":"Here the story begins..."}'::jsonb),
('starfall', 2,
  '{"ru":"Звездопад","en":"Starfall"}'::jsonb, 261,
  '{"ru":"Падают звёзды в тёмный лес,\nИ снова всё с начала.","en":"Stars are falling into the dark forest,\nAnd everything starts again."}'::jsonb),
('echoes', 1,
  '{"ru":"Эхо","en":"Echoes"}'::jsonb, 224,
  '{"ru":"Эхо в горах...","en":"Echoes in the mountains..."}'::jsonb);

INSERT INTO photos (url, position) VALUES
('https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=900&q=80', 1),
('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=80', 2),
('https://images.unsplash.com/photo-1506157786151-b8491531f063?w=900&q=80', 3),
('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=900&q=80', 4);

INSERT INTO videos (youtube_id, title, position) VALUES
('dQw4w9WgXcQ', '{"ru":"Live в клубе","en":"Live at the club"}'::jsonb, 1),
('9bZkp7q19f0', '{"ru":"Backstage","en":"Backstage"}'::jsonb, 2);
