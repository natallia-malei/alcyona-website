-- /studio/manage (stage 3): admin approves requests, books for others,
-- closes time, marks attendance and manages clients.
-- Apply AFTER 013 (uses bookings, profiles, studio_settings, is_admin()).
-- Apply in Supabase Dashboard → SQL Editor → Run
--
-- Errors are raised with a code in the message, the UI translates them
-- (see BOOKING_ERROR_CODES in src/supabase/bookings.ts):
--   forbidden, not_found, not_pending, request_expired, not_confirmed,
--   not_started, invalid_kind, client_required, guest_required,
--   label_too_long, cannot_block_admin, blocked
--   + from 012: invalid_duration, invalid_start, in_the_past,
--     purpose_too_long, slot_taken
--
-- "auth.uid() IS NOT NULL AND NOT is_admin()" → forbidden: the website calls
-- these as a signed-in user; the stage 4 bot calls them with the service role
-- (auth.uid() IS NULL), same convention as protect_profile_fields in 009.
--
-- An admin's "closed time" with no caption is stored as label = '' — the
-- calendar then shows "Busy" in the viewer's language.

-- ============================================================================
-- approve_booking(id) / reject_booking(id)
-- ============================================================================

CREATE FUNCTION public.approve_booking(p_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  b public.bookings;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF b.status <> 'pending' THEN
    RAISE EXCEPTION 'not_pending';
  END IF;
  -- Lazy expiry: the row may still say 'pending' though it's overdue
  IF b.expires_at <= NOW() THEN
    RAISE EXCEPTION 'request_expired';
  END IF;

  UPDATE public.bookings SET status = 'confirmed', expires_at = NULL WHERE id = p_id
  RETURNING * INTO b;
  RETURN b;
END;
$$;

CREATE FUNCTION public.reject_booking(p_id UUID)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  b public.bookings;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF b.status <> 'pending' THEN
    RAISE EXCEPTION 'not_pending';
  END IF;
  IF b.expires_at <= NOW() THEN
    RAISE EXCEPTION 'request_expired';
  END IF;

  UPDATE public.bookings SET status = 'rejected', expires_at = NULL WHERE id = p_id
  RETURNING * INTO b;
  RETURN b;
END;
$$;

-- ============================================================================
-- admin_create_booking(kind, starts_at, hours, …)
-- ============================================================================
-- kind = 'client' — for a registered client (p_user_id), shows in their "My bookings"
--        'guest'  — someone without an account (p_guest_name + p_guest_phone)
--        'block'  — closed time with an optional caption (p_label)
-- Always confirmed. No limits on hours / duration / horizon — only no overlap.
-- "What we'll do" is optional here.

CREATE FUNCTION public.admin_create_booking(
  p_kind TEXT,
  p_starts_at TIMESTAMPTZ,
  p_hours INTEGER,
  p_user_id UUID DEFAULT NULL,
  p_guest_name TEXT DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL,
  p_label TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid UUID := auth.uid();
  v_purpose TEXT := NULLIF(btrim(p_purpose), '');
  v_guest_name TEXT := NULLIF(btrim(p_guest_name), '');
  v_guest_phone TEXT := NULLIF(btrim(p_guest_phone), '');
  v_label TEXT;
  v_user_id UUID;
  client public.profiles;
  local_start TIMESTAMP;
  result public.bookings;
BEGIN
  IF uid IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_starts_at IS NULL OR p_hours IS NULL OR p_hours < 1 OR p_hours > 24 THEN
    RAISE EXCEPTION 'invalid_duration';
  END IF;
  local_start := p_starts_at AT TIME ZONE 'Europe/Minsk';
  IF local_start <> date_trunc('hour', local_start) THEN
    RAISE EXCEPTION 'invalid_start';
  END IF;
  IF p_starts_at <= NOW() THEN
    RAISE EXCEPTION 'in_the_past';
  END IF;
  IF char_length(v_purpose) > 200 THEN
    RAISE EXCEPTION 'purpose_too_long';
  END IF;

  CASE p_kind
    WHEN 'client' THEN
      IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'client_required';
      END IF;
      SELECT * INTO client FROM public.profiles WHERE id = p_user_id;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'not_found';
      END IF;
      IF client.blocked THEN
        RAISE EXCEPTION 'blocked';
      END IF;
      v_user_id := p_user_id;
      v_guest_name := NULL;
      v_guest_phone := NULL;
    WHEN 'guest' THEN
      IF v_guest_name IS NULL OR v_guest_phone IS NULL THEN
        RAISE EXCEPTION 'guest_required';
      END IF;
    WHEN 'block' THEN
      v_label := COALESCE(btrim(p_label), '');   -- '' = "Busy" in the viewer's language
      IF char_length(v_label) > 60 THEN
        RAISE EXCEPTION 'label_too_long';
      END IF;
      v_guest_name := NULL;
      v_guest_phone := NULL;
    ELSE
      RAISE EXCEPTION 'invalid_kind';
  END CASE;

  PERFORM public.expire_booking_requests();

  BEGIN
    INSERT INTO public.bookings
      (starts_at, ends_at, status, purpose, user_id, guest_name, guest_phone, label, created_by)
    VALUES
      (p_starts_at, p_starts_at + make_interval(hours => p_hours), 'confirmed', v_purpose,
       v_user_id, v_guest_name, v_guest_phone, v_label, uid)
    RETURNING * INTO result;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'slot_taken';
  END;

  RETURN result;
END;
$$;

-- ============================================================================
-- mark_attendance(id, attended)
-- ============================================================================
-- attended: TRUE = came, FALSE = no-show, NULL = clear the mark.
-- Effect on the client (only for bookings of a registered client):
--   no-show       → no_show_count + 1; reaching no_show_limit removes trust
--   came          → the client's first "came" ever makes them trusted
--                   (if their no-shows are below the limit)
--   changed mark  → the counter is corrected, not added to again
-- A wrongly marked no-show that cost the client their trust is fixed by
-- correcting the mark AND returning trust in Clients (set_client_trusted).
-- The stage 4 bot calls this too ("came?" poll, 48 h without answer = came).

CREATE FUNCTION public.mark_attendance(p_id UUID, p_attended BOOLEAN)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  b public.bookings;
  old_mark BOOLEAN;
  client public.profiles;
  s public.studio_settings;
  delta INTEGER;
  new_count INTEGER;
  new_trusted BOOLEAN;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO b FROM public.bookings WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF b.status <> 'confirmed' THEN
    RAISE EXCEPTION 'not_confirmed';
  END IF;
  IF b.starts_at > NOW() THEN
    RAISE EXCEPTION 'not_started';
  END IF;

  old_mark := b.attended;
  IF old_mark IS NOT DISTINCT FROM p_attended THEN
    RETURN b;
  END IF;

  UPDATE public.bookings SET attended = p_attended WHERE id = p_id
  RETURNING * INTO b;

  IF b.user_id IS NULL THEN
    RETURN b;   -- guest / closed time / deleted user: nothing to count
  END IF;

  SELECT * INTO s FROM public.studio_settings WHERE id = 1;
  SELECT * INTO client FROM public.profiles WHERE id = b.user_id FOR UPDATE;

  delta := (CASE WHEN p_attended IS FALSE THEN 1 ELSE 0 END)
         - (CASE WHEN old_mark IS FALSE THEN 1 ELSE 0 END);
  new_count := GREATEST(client.no_show_count + delta, 0);
  new_trusted := client.trusted;

  IF delta > 0 AND new_count >= s.no_show_limit THEN
    new_trusted := FALSE;
  END IF;

  IF p_attended IS TRUE
     AND NOT client.trusted
     AND new_count < s.no_show_limit
     AND NOT EXISTS (
       SELECT 1 FROM public.bookings o
       WHERE o.user_id = b.user_id AND o.attended IS TRUE AND o.id <> b.id
     ) THEN
    new_trusted := TRUE;
  END IF;

  UPDATE public.profiles
  SET no_show_count = new_count, trusted = new_trusted
  WHERE id = b.user_id;

  RETURN b;
END;
$$;

-- ============================================================================
-- set_client_trusted(user_id, trusted) / set_client_blocked(user_id, blocked)
-- ============================================================================
-- Returning trust by hand resets the no-show counter.
-- Blocking cancels the client's future bookings and requests; returns how many.

CREATE FUNCTION public.set_client_trusted(p_user_id UUID, p_trusted BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.profiles
  SET trusted = p_trusted,
      no_show_count = CASE WHEN p_trusted THEN 0 ELSE no_show_count END
  WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
END;
$$;

CREATE FUNCTION public.set_client_blocked(p_user_id UUID, p_blocked BOOLEAN)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target public.profiles;
  cancelled_count INTEGER := 0;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO target FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found';
  END IF;
  IF p_blocked AND target.role = 'admin' THEN
    RAISE EXCEPTION 'cannot_block_admin';
  END IF;

  UPDATE public.profiles SET blocked = p_blocked WHERE id = p_user_id;

  IF p_blocked THEN
    UPDATE public.bookings
    SET status = 'cancelled'
    WHERE user_id = p_user_id
      AND starts_at > NOW()
      AND (status = 'confirmed' OR (status = 'pending' AND expires_at > NOW()));
    GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  END IF;

  RETURN cancelled_count;
END;
$$;

-- ============================================================================
-- get_clients()
-- ============================================================================
-- Everyone with an account (admins too, marked by role) + email from
-- auth.users and booking stats, for the Clients tab and "book for a client".

CREATE FUNCTION public.get_clients()
RETURNS TABLE (
  id UUID,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  telegram_username TEXT,
  email TEXT,
  role TEXT,
  trusted BOOLEAN,
  blocked BOOLEAN,
  no_show_count INTEGER,
  created_at TIMESTAMPTZ,
  upcoming_count INTEGER,
  attended_count INTEGER,
  last_visit_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.phone,
    p.telegram_username,
    u.email::TEXT,
    p.role,
    p.trusted,
    p.blocked,
    p.no_show_count,
    p.created_at,
    (SELECT count(*)::INTEGER FROM public.bookings b
     WHERE b.user_id = p.id AND b.starts_at > NOW()
       AND (b.status = 'confirmed' OR (b.status = 'pending' AND b.expires_at > NOW()))),
    (SELECT count(*)::INTEGER FROM public.bookings b
     WHERE b.user_id = p.id AND b.attended IS TRUE),
    (SELECT max(b.starts_at) FROM public.bookings b
     WHERE b.user_id = p.id AND b.attended IS TRUE)
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.last_name NULLS LAST, p.first_name NULLS LAST, u.email;
END;
$$;

-- ============================================================================
-- GRANTS
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.approve_booking(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_booking(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_booking(TEXT, TIMESTAMPTZ, INTEGER, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_attendance(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_client_trusted(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_client_blocked(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_clients() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_booking(TEXT, TIMESTAMPTZ, INTEGER, UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_attendance(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_client_trusted(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_client_blocked(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_clients() TO authenticated;
