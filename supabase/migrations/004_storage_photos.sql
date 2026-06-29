-- Storage bucket for band photos
-- Apply in Supabase Dashboard → SQL Editor → Run

-- 1. Create public bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies on storage.objects (anyone can read/write — matches our temp open writes)
-- ⚠️ Tighten with auth in future PR

CREATE POLICY "Public read photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'photos');

CREATE POLICY "Public upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Public update photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'photos')
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Public delete photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'photos');
