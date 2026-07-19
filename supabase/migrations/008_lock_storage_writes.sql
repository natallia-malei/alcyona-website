-- Restrict storage bucket writes to authenticated users only.
-- Reads stay public (buckets are public-viewable).
-- Apply AFTER shipping auth code.
-- Apply in Supabase Dashboard → SQL Editor → Run

-- covers
DROP POLICY IF EXISTS "Public upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Public update covers" ON storage.objects;
DROP POLICY IF EXISTS "Public delete covers" ON storage.objects;

CREATE POLICY "Auth upload covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Auth update covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'covers')
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Auth delete covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'covers');

-- photos
DROP POLICY IF EXISTS "Public upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete photos" ON storage.objects;

CREATE POLICY "Auth upload photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Auth update photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos')
  WITH CHECK (bucket_id = 'photos');

CREATE POLICY "Auth delete photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos');
