-- Studio access: the studio is for the band (and, later, approved renters).
-- New role 'applicant' — every new sign-up starts there and has NO access to
-- the studio until the admin approves them (Clients tab):
--   applicant → client  "Approve"          (renter with the rental rules)
--   applicant → member  "Add to band"      (no limits, see 017)
--   client    → applicant "Revoke access"
-- Access = role client, member or admin (has_studio_access()). The calendar
-- and booking refuse everyone else, visitors included.
-- The bot posts "👤 New sign-up waiting for approval" to the group.
-- Apply AFTER 017.
-- Apply in Supabase Dashboard → SQL Editor → Run
--
-- New error code: no_access.
-- After applying: redeploy the Edge Function "telegram" (new message type).

ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('applicant', 'client', 'member', 'admin'));
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'applicant';

-- Accounts that signed up so far (test accounts) haven't been approved either
UPDATE profiles SET role = 'applicant' WHERE role = 'client';

-- ============================================================================
-- has_studio_access()
-- ============================================================================

CREATE FUNCTION public.has_studio_access()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('client', 'member', 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_studio_access() TO authenticated;

-- ============================================================================
-- get_calendar — as in 017; nothing for visitors and applicants
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
  IF NOT public.has_studio_access() THEN
    RAISE EXCEPTION 'no_access';
  END IF;
  IF p_to <= p_from OR p_to - p_from > INTERVAL '62 days' THEN
    RAISE EXCEPTION 'invalid_range';
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.starts_at,
    b.ends_at,
    CASE
      WHEN b.label IS NOT NULL THEN 'admin'
      WHEN b.guest_name IS NOT NULL THEN 'guest'
      WHEN b.user_id IS NULL THEN 'deleted'
      ELSE 'client'
    END,
    CASE
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

REVOKE EXECUTE ON FUNCTION public.get_calendar(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;

-- ============================================================================
-- create_booking — as in 017, plus the access check
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
  IF NOT FOUND OR me.role NOT IN ('client', 'member', 'admin') THEN
    RAISE EXCEPTION 'no_access';
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
-- set_client_role — as in 017, plus 'applicant' ("Revoke access")
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_client_role(p_user_id UUID, p_role TEXT)
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
  IF p_role IS NULL OR p_role NOT IN ('applicant', 'client', 'member') THEN
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

-- ============================================================================
-- Telegram: "👤 New sign-up waiting for approval"
-- ============================================================================

ALTER TABLE notifications ADD COLUMN profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notifications DROP CONSTRAINT notifications_kind_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN ('requested', 'booked', 'closed', 'approved', 'rejected', 'expired', 'cancelled', 'test', 'signup'));

CREATE FUNCTION public.enqueue_signup_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role = 'applicant'
     AND EXISTS (SELECT 1 FROM public.studio_telegram WHERE id = 1 AND chat_id IS NOT NULL) THEN
    INSERT INTO public.notifications (kind, profile_id) VALUES ('signup', NEW.id);
    PERFORM public.telegram_kick();
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER enqueue_signup_notification
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_signup_notification();

REVOKE EXECUTE ON FUNCTION public.enqueue_signup_notification() FROM PUBLIC, anon, authenticated;

-- claim — as in 016, plus the sign-up's email (return type changes → drop first)
DROP FUNCTION public.telegram_claim_notifications(INTEGER);

CREATE FUNCTION public.telegram_claim_notifications(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id BIGINT,
  kind TEXT,
  prev_status TEXT,
  by_owner BOOLEAN,          -- the client changed their own booking
  by_admin BOOLEAN,          -- an admin did it
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  purpose TEXT,
  label TEXT,
  guest_name TEXT,
  has_user BOOLEAN,          -- FALSE + no guest/label = deleted account
  first_name TEXT,
  last_name TEXT,
  email TEXT,                -- kind 'signup' only
  chat_id BIGINT,
  thread_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH claimed AS (
    UPDATE public.notifications n
    SET claimed_at = NOW(), attempts = n.attempts + 1
    WHERE n.id IN (
      SELECT q.id FROM public.notifications q
      WHERE q.sent_at IS NULL
        AND q.attempts < 5
        AND (q.claimed_at IS NULL OR q.claimed_at < NOW() - INTERVAL '2 minutes')
      ORDER BY q.id
      LIMIT p_limit
      FOR UPDATE SKIP LOCKED
    )
    RETURNING n.*
  )
  SELECT
    c.id,
    c.kind,
    c.prev_status,
    COALESCE(c.actor_id = b.user_id, FALSE),
    EXISTS (SELECT 1 FROM public.profiles a WHERE a.id = c.actor_id AND a.role = 'admin'),
    b.starts_at,
    b.ends_at,
    b.purpose,
    b.label,
    b.guest_name,
    b.user_id IS NOT NULL,
    p.first_name,
    p.last_name,
    u.email::TEXT,
    t.chat_id,
    t.thread_id
  FROM claimed c
  CROSS JOIN public.studio_telegram t
  LEFT JOIN public.bookings b ON b.id = c.booking_id
  LEFT JOIN public.profiles p ON p.id = COALESCE(b.user_id, c.profile_id)
  LEFT JOIN auth.users u ON u.id = c.profile_id
  WHERE t.id = 1
  ORDER BY c.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.telegram_claim_notifications(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_claim_notifications(INTEGER) TO service_role;
