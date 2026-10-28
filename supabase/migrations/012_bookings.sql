-- Studio bookings + calendar.
-- Clients never write to the table directly: every change goes through
-- create_booking / cancel_booking, which enforce the rules from studio_settings.
-- Everyone reads the calendar through get_calendar, which hides names and
-- "what we'll do" from people who shouldn't see them.
-- Apply AFTER 011 (uses is_admin() and studio_settings).
-- Apply in Supabase Dashboard → SQL Editor → Run
--
-- Until /studio/manage exists (stage 3), approve a request manually:
--   UPDATE bookings SET status = 'confirmed' WHERE id = '...';
-- or reject it:
--   UPDATE bookings SET status = 'rejected' WHERE id = '...';

-- ============================================================================
-- TABLE
-- ============================================================================
-- Who the booking is for (at most one of these is set):
--   user_id    — a client with an account (NULL after the account is deleted
--                → the calendar shows "Deleted user")
--   guest_name — someone without an account, booked by admin (stage 3)
--   label      — admin's own block, e.g. "Rehearsal" (stage 3)

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,                          -- pending request turns into 'expired' at this moment
  purpose TEXT CHECK (char_length(purpose) <= 200),   -- "what we'll do": author + admin only
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_name TEXT,
  guest_phone TEXT,
  label TEXT CHECK (char_length(label) <= 60),
  attended BOOLEAN,                                -- NULL = not marked yet (stage 4)
  series_id UUID,                                  -- recurring bookings (stage 5)
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK (ends_at > starts_at),
  CHECK (status <> 'pending' OR expires_at IS NOT NULL),
  CHECK (num_nonnulls(user_id, guest_name, label) <= 1),
  CHECK ((guest_name IS NULL) = (guest_phone IS NULL)),

  -- No double booking: active bookings can't overlap, even when two people
  -- press the button at the same moment. '[)' lets 10–12 and 12–14 touch.
  CONSTRAINT bookings_no_overlap
    EXCLUDE USING gist (tstzrange(starts_at, ends_at, '[)') WITH &&)
    WHERE (status IN ('pending', 'confirmed'))
);

CREATE INDEX bookings_user_id_starts_at_idx ON bookings (user_id, starts_at);
CREATE INDEX bookings_pending_expires_at_idx ON bookings (expires_at) WHERE status = 'pending';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE FUNCTION public.touch_booking_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_booking_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.touch_booking_updated_at();

-- Account deleted → its future bookings are cancelled (frees the slots);
-- past ones stay in history with user_id = NULL.
CREATE FUNCTION public.cancel_bookings_of_deleted_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE user_id = OLD.id
    AND status IN ('pending', 'confirmed')
    AND starts_at > NOW();
  RETURN OLD;
END;
$$;

CREATE TRIGGER cancel_bookings_of_deleted_profile
  BEFORE DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.cancel_bookings_of_deleted_profile();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Clients read their own rows ("My bookings"). No client write policies:
-- writes go through the SECURITY DEFINER functions below.

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own bookings or admin"
  ON bookings FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admin write bookings"
  ON bookings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================================
-- expire_booking_requests()
-- ============================================================================
-- Marks overdue requests as 'expired'. Called at the start of create_booking,
-- so an overdue request never blocks a new booking; get_calendar simply skips
-- overdue requests. The stage 4 cron job will call it on a schedule too
-- (to notify the admin).

CREATE FUNCTION public.expire_booking_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.bookings
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at <= NOW();
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

-- ============================================================================
-- create_booking(starts_at, hours, purpose)
-- ============================================================================
-- Errors are raised with a code in the message, the UI translates them:
--   not_authenticated, profile_incomplete, blocked, invalid_duration,
--   invalid_start, outside_hours, in_the_past, beyond_horizon,
--   purpose_required, purpose_too_long, limit_reached, too_late_for_request,
--   slot_taken

CREATE FUNCTION public.create_booking(
  p_starts_at TIMESTAMPTZ,
  p_hours INTEGER,
  p_purpose TEXT
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID := auth.uid();
  me public.profiles;
  s public.studio_settings;
  admin BOOLEAN;
  v_purpose TEXT := NULLIF(btrim(p_purpose), '');
  v_ends_at TIMESTAMPTZ;
  local_start TIMESTAMP;
  local_day DATE;
  today DATE := (NOW() AT TIME ZONE 'Europe/Minsk')::DATE;
  active_count INTEGER;
  new_status TEXT;
  new_expires_at TIMESTAMPTZ;
  result public.bookings;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- FOR UPDATE serializes concurrent calls of the same client,
  -- so the "max N bookings" check below can't be raced.
  SELECT * INTO me FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND
     OR NULLIF(btrim(me.first_name), '') IS NULL
     OR NULLIF(btrim(me.last_name), '') IS NULL
     OR NULLIF(btrim(me.phone), '') IS NULL THEN
    RAISE EXCEPTION 'profile_incomplete';
  END IF;
  IF me.blocked THEN
    RAISE EXCEPTION 'blocked';
  END IF;

  admin := me.role = 'admin';
  SELECT * INTO s FROM public.studio_settings WHERE id = 1;

  IF p_starts_at IS NULL OR p_hours IS NULL OR p_hours < 1 THEN
    RAISE EXCEPTION 'invalid_duration';
  END IF;
  v_ends_at := p_starts_at + make_interval(hours => p_hours);
  local_start := p_starts_at AT TIME ZONE 'Europe/Minsk';
  local_day := local_start::DATE;

  IF local_start <> date_trunc('hour', local_start) THEN
    RAISE EXCEPTION 'invalid_start';
  END IF;
  IF p_starts_at <= NOW() THEN
    RAISE EXCEPTION 'in_the_past';
  END IF;
  IF v_purpose IS NULL THEN
    RAISE EXCEPTION 'purpose_required';
  END IF;
  IF char_length(v_purpose) > 200 THEN
    RAISE EXCEPTION 'purpose_too_long';
  END IF;

  -- Admin has no limits on hours, duration, horizon or number of bookings.
  IF NOT admin THEN
    IF p_hours < s.min_booking_hours OR p_hours > s.max_booking_hours THEN
      RAISE EXCEPTION 'invalid_duration';
    END IF;
    -- Minsk has no DST, so local wall-clock arithmetic is exact.
    -- close_hour = 24 means "until midnight".
    IF local_start < local_day + make_interval(hours => s.open_hour)
       OR local_start + make_interval(hours => p_hours) > local_day + make_interval(hours => s.close_hour) THEN
      RAISE EXCEPTION 'outside_hours';
    END IF;
    -- 4 weeks = today + the next 27 days
    IF local_day >= today + s.booking_horizon_weeks * 7 THEN
      RAISE EXCEPTION 'beyond_horizon';
    END IF;
  END IF;

  PERFORM public.expire_booking_requests();

  IF NOT admin THEN
    -- Recurring bookings (series_id) don't count towards the limit.
    SELECT count(*) INTO active_count
    FROM public.bookings b
    WHERE b.user_id = uid
      AND b.series_id IS NULL
      AND b.status IN ('pending', 'confirmed')
      AND b.starts_at > NOW();
    IF active_count >= s.max_active_bookings THEN
      RAISE EXCEPTION 'limit_reached';
    END IF;
  END IF;

  IF admin OR me.trusted THEN
    new_status := 'confirmed';
  ELSE
    new_status := 'pending';
    new_expires_at := LEAST(
      NOW() + make_interval(hours => s.request_ttl_hours),
      p_starts_at - make_interval(hours => s.request_cutoff_hours)
    );
    -- Too close to the start: the request would expire before admin sees it.
    IF new_expires_at <= NOW() THEN
      RAISE EXCEPTION 'too_late_for_request';
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.bookings (starts_at, ends_at, status, expires_at, purpose, user_id, created_by)
    VALUES (p_starts_at, v_ends_at, new_status, new_expires_at, v_purpose, uid, uid)
    RETURNING * INTO result;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'slot_taken';
  END;

  RETURN result;
END;
$$;

-- ============================================================================
-- cancel_booking(id)
-- ============================================================================
-- A client cancels a confirmed booking no later than free_cancel_hours before
-- the start; after that only admin can. A pending request can be withdrawn
-- at any time — it isn't a booking yet.
-- Errors: not_authenticated, not_found, not_active, too_late_to_cancel

CREATE FUNCTION public.cancel_booking(p_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID := auth.uid();
  admin BOOLEAN := public.is_admin();
  b public.bookings;
  s public.studio_settings;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_id FOR UPDATE;
  IF NOT FOUND OR (b.user_id IS DISTINCT FROM uid AND NOT admin) THEN
    RAISE EXCEPTION 'not_found';
  END IF;

  IF NOT (b.status = 'confirmed' OR (b.status = 'pending' AND b.expires_at > NOW()))
     OR b.starts_at <= NOW() THEN
    RAISE EXCEPTION 'not_active';
  END IF;

  SELECT * INTO s FROM public.studio_settings WHERE id = 1;
  IF NOT admin
     AND b.status = 'confirmed'
     AND b.starts_at - make_interval(hours => s.free_cancel_hours) < NOW() THEN
    RAISE EXCEPTION 'too_late_to_cancel';
  END IF;

  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_id
  RETURNING * INTO b;
  RETURN b;
END;
$$;

-- ============================================================================
-- get_calendar(from, to)
-- ============================================================================
-- Active bookings overlapping [from, to). What each viewer gets:
--   anonymous       — only the time (the UI shows "Busy")
--   signed in       — + client's full name if they consented (show_full_name),
--                       + admin's label
--   author / admin  — + status and purpose; admin also sees every name
-- kind: 'client' | 'guest' | 'admin' | 'deleted' (NULL for anonymous)

CREATE FUNCTION public.get_calendar(p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
RETURNS TABLE (
  id UUID,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  kind TEXT,
  title TEXT,
  is_mine BOOLEAN,
  status TEXT,
  purpose TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID := auth.uid();
  admin BOOLEAN := public.is_admin();
BEGIN
  IF p_to <= p_from OR p_to - p_from > INTERVAL '62 days' THEN
    RAISE EXCEPTION 'invalid_range';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.starts_at,
    b.ends_at,
    CASE
      WHEN uid IS NULL THEN NULL
      WHEN b.label IS NOT NULL THEN 'admin'
      WHEN b.guest_name IS NOT NULL THEN 'guest'
      WHEN b.user_id IS NULL THEN 'deleted'
      ELSE 'client'
    END,
    CASE
      WHEN uid IS NULL THEN NULL
      WHEN b.label IS NOT NULL THEN b.label
      WHEN b.guest_name IS NOT NULL THEN CASE WHEN admin THEN b.guest_name END
      WHEN p.id IS NULL THEN NULL
      WHEN admin OR p.id = uid OR p.show_full_name THEN btrim(p.first_name || ' ' || p.last_name)
    END,
    COALESCE(b.user_id = uid, FALSE),
    CASE WHEN admin OR b.user_id = uid THEN b.status END,
    CASE WHEN admin OR b.user_id = uid THEN b.purpose END
  FROM public.bookings b
  LEFT JOIN public.profiles p ON p.id = b.user_id
  WHERE (b.status = 'confirmed' OR (b.status = 'pending' AND b.expires_at > NOW()))
    AND b.starts_at < p_to
    AND b.ends_at > p_from
  ORDER BY b.starts_at;
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================
-- Supabase grants EXECUTE on new functions to anon/authenticated by default.

REVOKE EXECUTE ON FUNCTION public.expire_booking_requests() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_booking_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_bookings_of_deleted_profile() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_booking(TIMESTAMPTZ, INTEGER, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cancel_booking(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(TIMESTAMPTZ, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_calendar(TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated;
