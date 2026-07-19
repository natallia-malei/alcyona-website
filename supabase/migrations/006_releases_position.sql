-- Add explicit sort order to releases (so drag-and-drop reorder works
-- independently of release_date). Backfill by current release_date order.
-- Apply in Supabase Dashboard → SQL Editor → Run

ALTER TABLE releases ADD COLUMN position INTEGER;

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY release_date DESC, id) AS rn
  FROM releases
)
UPDATE releases r
SET position = ranked.rn
FROM ranked
WHERE r.id = ranked.id;

ALTER TABLE releases ALTER COLUMN position SET NOT NULL;

CREATE INDEX IF NOT EXISTS releases_position_idx ON releases (position);
