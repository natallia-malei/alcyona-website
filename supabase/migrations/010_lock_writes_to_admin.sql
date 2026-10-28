-- Restrict all site writes (tables + storage) from any authenticated user
-- to admins only. Clients can now sign in, so "authenticated" is no longer
-- the same as "admin".
-- Apply AFTER 009 and AFTER setting role = 'admin' on your own profile —
-- otherwise nobody can edit the site. The check below aborts if no admin exists.
-- Apply in Supabase Dashboard → SQL Editor → Run

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'No admin in profiles. Run UPDATE profiles SET role = ''admin'' ... first (see 009).';
  END IF;
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

DROP POLICY IF EXISTS "Auth write releases"  ON releases;
DROP POLICY IF EXISTS "Auth write tracks"    ON tracks;
DROP POLICY IF EXISTS "Auth write photos"    ON photos;
DROP POLICY IF EXISTS "Auth write videos"    ON videos;
DROP POLICY IF EXISTS "Auth write band_info" ON band_info;

CREATE POLICY "Admin write releases"  ON releases  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write tracks"    ON tracks    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write photos"    ON photos    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write videos"    ON videos    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin write band_info" ON band_info FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================================
-- STORAGE
-- ============================================================================

-- covers
DROP POLICY IF EXISTS "Auth upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Auth update covers" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete covers" ON storage.objects;

CREATE POLICY "Admin upload covers"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND public.is_admin());

CREATE POLICY "Admin update covers"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND public.is_admin())
  WITH CHECK (bucket_id = 'covers' AND public.is_admin());

CREATE POLICY "Admin delete covers"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND public.is_admin());

-- photos
DROP POLICY IF EXISTS "Auth upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth update photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth delete photos" ON storage.objects;

CREATE POLICY "Admin upload photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND public.is_admin());

CREATE POLICY "Admin update photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'photos' AND public.is_admin())
  WITH CHECK (bucket_id = 'photos' AND public.is_admin());

CREATE POLICY "Admin delete photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND public.is_admin());
