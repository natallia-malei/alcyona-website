-- TEMPORARY: open INSERT/UPDATE/DELETE to anon role (no auth yet)
-- Apply in Supabase Dashboard → SQL Editor → Run
--
-- ⚠️ This is for development only. Replace with proper auth in migration 003.

DROP POLICY IF EXISTS "Auth write releases"  ON releases;
DROP POLICY IF EXISTS "Auth write tracks"    ON tracks;
DROP POLICY IF EXISTS "Auth write photos"    ON photos;
DROP POLICY IF EXISTS "Auth write videos"    ON videos;
DROP POLICY IF EXISTS "Auth write band_info" ON band_info;

CREATE POLICY "Public write releases"  ON releases  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write tracks"    ON tracks    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write photos"    ON photos    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write videos"    ON videos    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public write band_info" ON band_info FOR ALL USING (true) WITH CHECK (true);
