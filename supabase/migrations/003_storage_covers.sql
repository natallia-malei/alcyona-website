-- Storage bucket for release covers
-- Apply in Supabase Dashboard → SQL Editor → Run

-- 1. Create public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies on storage.objects (anyone can read/write — matches our temp open writes)
-- ⚠️ Tighten with auth in future PR

CREATE POLICY "Public read covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Public upload covers"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Public update covers"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'covers')
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Public delete covers"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'covers');
