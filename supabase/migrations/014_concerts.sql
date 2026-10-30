-- Concerts: upcoming dates with tickets + an archive of past shows with live videos.
-- Public read, admin-only writes (same rule as releases after 010).
-- Apply AFTER 010.
-- Apply in Supabase Dashboard → SQL Editor → Run

CREATE TABLE concerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concert_date DATE NOT NULL,
  start_time TEXT CHECK (start_time IS NULL OR start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),  -- "19:00", local time
  city JSONB NOT NULL,                     -- { ru, en }
  venue TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'on_sale'
    CHECK (status IN ('announced', 'on_sale', 'sold_out', 'cancelled')),
  ticket_url TEXT,
  vip_url TEXT,
  video_url TEXT,                          -- live video for the archive
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_concerts_date ON concerts (concert_date);

ALTER TABLE concerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read concerts" ON concerts FOR SELECT USING (true);
CREATE POLICY "Admin write concerts" ON concerts FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
