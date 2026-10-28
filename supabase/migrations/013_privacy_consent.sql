-- Consent to personal data processing: clients tick it in the profile form,
-- create_booking refuses without it (new error code: consent_required).
-- Apply AFTER 012.
-- Apply in Supabase Dashboard → SQL Editor → Run

ALTER TABLE profiles ADD COLUMN privacy_consent_at TIMESTAMPTZ;   -- NULL = no consent yet

-- ============================================================================
-- create_booking — same as in 012, plus the consent check
-- ============================================================================
-- Errors: see 012, plus consent_required

CREATE OR REPLACE FUNCTION public.create_booking(
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
  -- Consent to personal data processing (Privacy page). Admin is the operator.
  IF NOT admin AND me.privacy_consent_at IS NULL THEN
    RAISE EXCEPTION 'consent_required';
  END IF;
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
