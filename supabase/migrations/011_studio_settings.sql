-- Studio booking rules — a single row, edited by admin in /studio/manage → Settings.
-- Apply AFTER 009 (uses is_admin()).
-- Apply in Supabase Dashboard → SQL Editor → Run

CREATE TABLE studio_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  open_hour SMALLINT NOT NULL DEFAULT 8,               -- first bookable hour (Europe/Minsk)
  close_hour SMALLINT NOT NULL DEFAULT 24,             -- bookings must end by this hour
  min_booking_hours SMALLINT NOT NULL DEFAULT 2,
  max_booking_hours SMALLINT NOT NULL DEFAULT 4,
  booking_horizon_weeks SMALLINT NOT NULL DEFAULT 4,   -- how far ahead clients can book
  max_active_bookings SMALLINT NOT NULL DEFAULT 3,     -- future bookings per client
  request_ttl_hours SMALLINT NOT NULL DEFAULT 24,      -- pending request expires after this…
  request_cutoff_hours SMALLINT NOT NULL DEFAULT 2,    -- …or this many hours before start
  free_cancel_hours SMALLINT NOT NULL DEFAULT 24,      -- client can cancel up to N hours before
  no_show_limit SMALLINT NOT NULL DEFAULT 2,           -- no-shows before losing trusted status
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (open_hour >= 0 AND close_hour <= 24 AND open_hour < close_hour),
  CHECK (min_booking_hours >= 1 AND min_booking_hours <= max_booking_hours),
  CHECK (max_booking_hours <= close_hour - open_hour),
  CHECK (booking_horizon_weeks >= 1),
  CHECK (max_active_bookings >= 1),
  CHECK (request_ttl_hours >= 1),
  CHECK (request_cutoff_hours >= 0),
  CHECK (free_cancel_hours >= 0),
  CHECK (no_show_limit >= 1)
);

INSERT INTO studio_settings (id) VALUES (1);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- UPDATE only (no INSERT/DELETE) — the single row must always exist.

ALTER TABLE studio_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read studio_settings"
  ON studio_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin update studio_settings"
  ON studio_settings FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
