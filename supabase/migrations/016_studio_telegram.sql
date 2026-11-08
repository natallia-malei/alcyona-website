-- Telegram feed of the studio (stage 4): the bot posts every booking event into
-- one topic of the band's group chat ("Studio"). No buttons — approving
-- requests stays on the website (/studio/manage).
-- Apply AFTER 015.
-- Apply in Supabase Dashboard → SQL Editor → Run
--
-- How it fits together:
--   bookings ──trigger──▶ notifications (queue) ──pg_net──▶ Edge Function "telegram"
--                                                          (?action=drain) ──▶ Telegram
--   pg_cron every 5 min: studio_tick() — expires overdue requests (→ "expired"
--   messages) and retries whatever wasn't sent.
--   The group is connected with a one-time code: admin gets it in Settings,
--   sends "/connect@<bot> CODE" in the topic, the bot calls telegram_connect().
--
-- Nothing is queued while no chat is connected, so connecting later doesn't
-- flood the group with old events.
--
-- New error code: telegram_not_connected (+ forbidden from 015).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- ============================================================================
-- studio_telegram — single row: where the bot writes
-- ============================================================================

CREATE TABLE studio_telegram (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  chat_id BIGINT,                      -- the group; NULL = not connected
  thread_id INTEGER,                   -- topic in that group; NULL = general chat
  chat_title TEXT,
  connected_at TIMESTAMPTZ,
  connect_code TEXT,                   -- one-time code for /connect
  connect_code_expires_at TIMESTAMPTZ,
  bot_username TEXT,                   -- filled in by the Edge Function (?action=setup)
  notify_url TEXT,                     -- Edge Function URL pg_net calls to send the queue
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO studio_telegram (id) VALUES (1);

-- Admin reads the status in Settings; every change goes through the functions below
ALTER TABLE studio_telegram ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read studio_telegram"
  ON studio_telegram FOR SELECT TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- notifications — the queue (service role only)
-- ============================================================================
-- kind: requested | booked | closed | approved | rejected | expired | cancelled | test
-- The Edge Function builds the text when it sends, from the booking as it is then.

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL
    CHECK (kind IN ('requested', 'booked', 'closed', 'approved', 'rejected', 'expired', 'cancelled', 'test')),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  prev_status TEXT,                    -- status before the change (UPDATE only)
  actor_id UUID,                       -- who did it (auth.uid()); NULL = system (expiry, cron)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,              -- taken by a sender; free again after 2 minutes
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  last_error TEXT
);

CREATE INDEX notifications_unsent_idx ON notifications (id) WHERE sent_at IS NULL;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;   -- no policies: service role only

-- ============================================================================
-- telegram_kick() — ask the Edge Function to send the queue
-- ============================================================================
-- pg_net queues the HTTP request inside the transaction and sends it after
-- commit, so the function always sees the committed rows.

CREATE FUNCTION public.telegram_kick()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  url TEXT;
BEGIN
  SELECT t.notify_url INTO url
  FROM public.studio_telegram t
  WHERE t.id = 1 AND t.chat_id IS NOT NULL;

  IF url IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.notifications n WHERE n.sent_at IS NULL AND n.attempts < 5) THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := url,
    body := '{"action":"drain"}'::jsonb,
    headers := '{"Content-Type":"application/json"}'::jsonb
  );
END;
$$;

-- ============================================================================
-- Triggers on bookings
-- ============================================================================

CREATE FUNCTION public.enqueue_booking_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_kind TEXT;
  v_prev TEXT;
BEGIN
  -- Not connected yet, or a change to history (past bookings) — stay quiet
  IF NOT EXISTS (SELECT 1 FROM public.studio_telegram WHERE id = 1 AND chat_id IS NOT NULL)
     OR NEW.ends_at <= NOW() THEN
    RETURN NULL;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_kind := CASE
      WHEN NEW.status = 'pending' THEN 'requested'
      WHEN NEW.status = 'confirmed' AND NEW.label IS NOT NULL THEN 'closed'
      WHEN NEW.status = 'confirmed' THEN 'booked'
    END;
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    v_prev := OLD.status;
    v_kind := CASE NEW.status
      WHEN 'confirmed' THEN 'approved'
      WHEN 'rejected' THEN 'rejected'
      WHEN 'expired' THEN 'expired'
      WHEN 'cancelled' THEN 'cancelled'
    END;
  END IF;

  IF v_kind IS NOT NULL THEN
    INSERT INTO public.notifications (kind, booking_id, prev_status, actor_id)
    VALUES (v_kind, NEW.id, v_prev, auth.uid());
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER enqueue_booking_notification
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_booking_notification();

-- One HTTP call per statement, however many rows it touched (e.g. blocking a client)
CREATE FUNCTION public.kick_after_bookings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.telegram_kick();
  RETURN NULL;
END;
$$;

CREATE TRIGGER kick_after_bookings_change
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH STATEMENT EXECUTE FUNCTION public.kick_after_bookings_change();

-- ============================================================================
-- Admin: connect / disconnect / test (Settings → Telegram)
-- ============================================================================

-- A 6-character code valid for 15 minutes; a new one replaces the old one
CREATE FUNCTION public.create_telegram_connect_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  code TEXT := upper(substr(md5(gen_random_uuid()::TEXT), 1, 6));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.studio_telegram
  SET connect_code = code,
      connect_code_expires_at = NOW() + INTERVAL '15 minutes',
      updated_at = NOW()
  WHERE id = 1;
  RETURN code;
END;
$$;

-- Unsent messages are dropped: they were meant for the old chat
CREATE FUNCTION public.disconnect_telegram()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.studio_telegram
  SET chat_id = NULL, thread_id = NULL, chat_title = NULL, connected_at = NULL,
      connect_code = NULL, connect_code_expires_at = NULL, updated_at = NOW()
  WHERE id = 1;
  DELETE FROM public.notifications WHERE sent_at IS NULL;
END;
$$;

CREATE FUNCTION public.send_telegram_test()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.studio_telegram WHERE id = 1 AND chat_id IS NOT NULL) THEN
    RAISE EXCEPTION 'telegram_not_connected';
  END IF;

  INSERT INTO public.notifications (kind, actor_id) VALUES ('test', auth.uid());
  PERFORM public.telegram_kick();
END;
$$;

-- ============================================================================
-- Edge Function only (service role): setup, /connect, sending
-- ============================================================================

CREATE FUNCTION public.telegram_set_bot(p_username TEXT, p_notify_url TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.studio_telegram
  SET bot_username = p_username, notify_url = p_notify_url, updated_at = NOW()
  WHERE id = 1;
$$;

-- "/connect CODE" from a group: TRUE if the code matched and the chat is saved
CREATE FUNCTION public.telegram_connect(
  p_code TEXT,
  p_chat_id BIGINT,
  p_thread_id INTEGER,
  p_title TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.studio_telegram
  SET chat_id = p_chat_id,
      thread_id = p_thread_id,
      chat_title = p_title,
      connected_at = NOW(),
      connect_code = NULL,
      connect_code_expires_at = NULL,
      updated_at = NOW()
  WHERE id = 1
    AND connect_code IS NOT NULL
    AND connect_code = upper(btrim(p_code))
    AND connect_code_expires_at > NOW();
  RETURN FOUND;
END;
$$;

-- Takes up to p_limit unsent messages (a message taken but not confirmed within
-- 2 minutes is taken again; after 5 attempts it's given up) with everything
-- needed for the text.
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
    t.chat_id,
    t.thread_id
  FROM claimed c
  CROSS JOIN public.studio_telegram t
  LEFT JOIN public.bookings b ON b.id = c.booking_id
  LEFT JOIN public.profiles p ON p.id = b.user_id
  WHERE t.id = 1
  ORDER BY c.id;
END;
$$;

-- p_error NULL = sent; otherwise it's retried by the next tick
CREATE FUNCTION public.telegram_mark_sent(p_id BIGINT, p_error TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.notifications
  SET sent_at = CASE WHEN p_error IS NULL THEN NOW() END,
      last_error = p_error,
      claimed_at = CASE WHEN p_error IS NULL THEN claimed_at END
  WHERE id = p_id;
$$;

-- ============================================================================
-- studio_tick() — every 5 minutes (pg_cron)
-- ============================================================================

CREATE FUNCTION public.studio_tick()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.expire_booking_requests();   -- → "expired" messages via the trigger
  PERFORM public.telegram_kick();             -- retries anything unsent
  DELETE FROM public.notifications WHERE sent_at < NOW() - INTERVAL '30 days';
END;
$$;

SELECT cron.schedule('studio-tick', '*/5 * * * *', 'SELECT public.studio_tick()');

-- ============================================================================
-- GRANTS
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.telegram_kick() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_booking_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.kick_after_bookings_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.studio_tick() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_telegram_connect_code() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.disconnect_telegram() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.send_telegram_test() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_telegram_connect_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.disconnect_telegram() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_telegram_test() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.telegram_set_bot(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.telegram_connect(TEXT, BIGINT, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.telegram_claim_notifications(INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.telegram_mark_sent(BIGINT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.telegram_set_bot(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.telegram_connect(TEXT, BIGINT, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.telegram_claim_notifications(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.telegram_mark_sent(BIGINT, TEXT) TO service_role;
