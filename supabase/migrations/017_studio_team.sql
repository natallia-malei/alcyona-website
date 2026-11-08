-- Team mode: band members book the studio without limits (no sub-renting yet).
-- New role 'member' between 'client' and 'admin'. The rental rules (requests,
-- trust, limits from studio_settings) stay as they are — they apply to
-- 'client' accounts only, and there are none while sign-up is closed.
-- Apply AFTER 016.
-- Apply in Supabase Dashboard → SQL Editor → Run
--
-- "Team" below = role 'member' or 'admin'. A team member:
--   • books any length (from 1 h), any date ahead, any number of bookings,
--     always confirmed at once, "what we'll do" optional;
--   • needs only a first and last name in the profile (no phone, no consent);
--   • cancels their own bookings at any time;
--   • shows their name in the calendar to everyone signed in.
-- Only the admin changes roles: set_client_role (Clients tab).
-- New error codes: invalid_role, cannot_change_admin.

ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'member', 'admin'));

-- ============================================================================
-- create_booking — as in 013, with the team rules
-- ============================================================================

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
  team BOOLEAN;
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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_incomplete';
  END IF;
  team := me.role IN ('member', 'admin');

  -- Name for everyone; phone only for clients
  IF NULLIF(btrim(me.first_name), '') IS NULL
     OR NULLIF(btrim(me.last_name), '') IS NULL
     OR (NOT team AND NULLIF(btrim(me.phone), '') IS NULL) THEN
    RAISE EXCEPTION 'profile_incomplete';
  END IF;
  IF me.blocked THEN
    RAISE EXCEPTION 'blocked';
  END IF;
  -- Consent to personal data processing — clients only
  IF NOT team AND me.privacy_consent_at IS NULL THEN
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
  IF v_purpose IS NULL AND NOT team THEN
    RAISE EXCEPTION 'purpose_required';
  END IF;
  IF char_length(v_purpose) > 200 THEN
    RAISE EXCEPTION 'purpose_too_long';
  END IF;

  -- The team has no limits on hours, duration, horizon or number of bookings
  IF NOT team THEN
    IF p_hours < s.min_booking_hours OR p_hours > s.max_booking_hours THEN
      RAISE EXCEPTION 'invalid_duration';
    END IF;
    -- Minsk has no DST, so local wall-clock arithmetic is exact.
    -- close_hour = 24 means "until midnight".
    IF local_start < local_day + make_interval(hours => s.open_hour)
       OR local_start + make_interval(hours => p_hours) > local_day + make_interval(hours => s.close_hour) THEN
      RAISE EXCEPTION 'outside_hours';
    END IF;
    IF local_day >= today + s.booking_horizon_weeks * 7 THEN
      RAISE EXCEPTION 'beyond_horizon';
    END IF;
  END IF;

  PERFORM public.expire_booking_requests();

  IF NOT team THEN
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

  IF team OR me.trusted THEN
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
-- cancel_booking — as in 012; the team cancels its own bookings any time
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_booking(p_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID := auth.uid();
  admin BOOLEAN := public.is_admin();
  team BOOLEAN;
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

  SELECT p.role IN ('member', 'admin') INTO team FROM public.profiles p WHERE p.id = uid;
  SELECT * INTO s FROM public.studio_settings WHERE id = 1;
  IF NOT COALESCE(team, FALSE)
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
-- get_calendar — as in 012; team members' names are shown to everyone signed in
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_calendar(p_from TIMESTAMPTZ, p_to TIMESTAMPTZ)
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
      WHEN admin OR p.id = uid OR p.show_full_name OR p.role IN ('member', 'admin')
        THEN btrim(p.first_name || ' ' || p.last_name)
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
-- set_client_role(user_id, role) — Clients tab: "Add to band" / "Remove from band"
-- ============================================================================

CREATE FUNCTION public.set_client_role(p_user_id UUID, p_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target public.profiles;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('client', 'member') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  SELECT * INTO target FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF target.role = 'admin' THEN
    RAISE EXCEPTION 'cannot_change_admin';
  END IF;

  UPDATE public.profiles SET role = p_role WHERE id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_client_role(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_client_role(UUID, TEXT) TO authenticated;
