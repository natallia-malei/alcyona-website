-- Revert temporary public-write policies (from migration 002) back to
-- authenticated-only. Apply AFTER shipping auth code + creating an admin user
-- in Supabase Dashboard → Auth → Users.
-- Apply in Supabase Dashboard → SQL Editor → Run

DROP POLICY IF EXISTS "Public write releases"  ON releases;
DROP POLICY IF EXISTS "Public write tracks"    ON tracks;
DROP POLICY IF EXISTS "Public write photos"    ON photos;
DROP POLICY IF EXISTS "Public write videos"    ON videos;
DROP POLICY IF EXISTS "Public write band_info" ON band_info;

CREATE POLICY "Auth write releases"  ON releases  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write tracks"    ON tracks    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write photos"    ON photos    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write videos"    ON videos    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth write band_info" ON band_info FOR ALL TO authenticated USING (true) WITH CHECK (true);
