-- Tests for 016_studio_telegram (connect code, notification queue, claim/mark).
-- Needs 012–016 applied. Sends nothing to Telegram: notify_url is cleared for
-- the run, so no HTTP call is made.
-- Run in Supabase Dashboard → SQL Editor → Run. Result: one table
-- "check | expected | got | ok" — every row should be ✅.
--
-- Creates 2 temporary users, temporarily "connects" a fake chat, then puts
-- the real Telegram settings back and deletes everything it made.
-- If anything fails midway, the whole run is rolled back.
-- Uses 03:00–05:00 slots 60–62 days ahead (studio closed then) and, for a
-- client booking (horizon 4 weeks), 26 days ahead 22:00–24:00 — if a real
-- booking sits there, the queue check shows it.

DROP TABLE IF EXISTS pg_temp._results;
CREATE TEMP TABLE _results (n SERIAL, check_name TEXT, expected TEXT, got TEXT);

CREATE OR REPLACE FUNCTION pg_temp.at(d INTEGER, h INTEGER) RETURNS TIMESTAMPTZ
LANGUAGE sql STABLE AS $$
  SELECT ((NOW() AT TIME ZONE 'Europe/Minsk')::DATE + d + make_interval(hours => h)) AT TIME ZONE 'Europe/Minsk'
$$;

CREATE OR REPLACE FUNCTION pg_temp.run(p_role TEXT, p_uid UUID, q TEXT) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE r TEXT;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', COALESCE(p_uid::TEXT, ''), TRUE);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::TEXT, TRUE);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  EXECUTE q INTO r;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', TRUE);
  PERFORM set_config('request.jwt.claims', '', TRUE);
  RETURN COALESCE(r, '∅');
EXCEPTION WHEN OTHERS THEN
  RETURN SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.chk(name TEXT, expected TEXT, got TEXT) RETURNS VOID
LANGUAGE sql AS $$ INSERT INTO _results (check_name, expected, got) VALUES (name, expected, got) $$;

DO $test$
DECLARE
  ella UUID := 'd0000000-0000-4000-8000-0000000000e1';  -- trusted band member
  adm  UUID := 'd0000000-0000-4000-8000-0000000000ad';  -- admin
  saved public.studio_telegram;
  code TEXT;
  b1 UUID;
  -- kinds queued so far, oldest first
  queue CONSTANT TEXT := $$SELECT string_agg(kind || COALESCE(':' || prev_status, ''), ',' ORDER BY id) FROM public.notifications WHERE id > %s$$;
  mark BIGINT;
BEGIN
  SELECT * INTO saved FROM public.studio_telegram WHERE id = 1;
  SELECT COALESCE(max(id), 0) INTO mark FROM public.notifications;

  INSERT INTO auth.users (id, email, aud, role) VALUES
    (ella, 'test-ella@example.invalid',  'authenticated', 'authenticated'),
    (adm,  'test-admin@example.invalid', 'authenticated', 'authenticated');
  UPDATE public.profiles SET first_name = 'Эля', last_name = 'Test', phone = '+375290000001', trusted = TRUE, privacy_consent_at = NOW() WHERE id = ella;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Admin', phone = '+375290000005', role = 'admin' WHERE id = adm;

  -- ------------------------------------------------------------ connect code
  UPDATE public.studio_telegram SET chat_id = NULL, thread_id = NULL, notify_url = NULL WHERE id = 1;
  -- Expire real overdue requests now, while nothing is queued, so they don't mix in
  PERFORM public.expire_booking_requests();

  PERFORM pg_temp.chk('client cannot get a connect code', 'forbidden',
    pg_temp.run('authenticated', ella, 'SELECT public.create_telegram_connect_code()'));
  PERFORM pg_temp.chk('client cannot read the Telegram settings', '0',
    pg_temp.run('authenticated', ella, 'SELECT count(*) FROM public.studio_telegram'));
  PERFORM pg_temp.chk('website user cannot call telegram_connect', 'permission denied for function telegram_connect',
    pg_temp.run('authenticated', adm, $$SELECT public.telegram_connect('X', 1, NULL, 'x')$$));

  code := pg_temp.run('authenticated', adm, 'SELECT public.create_telegram_connect_code()');
  PERFORM pg_temp.chk('admin gets a 6-character code', '6', length(code)::TEXT);
  PERFORM pg_temp.chk('admin reads the Telegram settings', '1',
    pg_temp.run('authenticated', adm, 'SELECT count(*) FROM public.studio_telegram'));

  PERFORM pg_temp.chk('not connected: test message refused', 'telegram_not_connected',
    pg_temp.run('authenticated', adm, 'SELECT public.send_telegram_test()'));

  -- Nothing is queued while no chat is connected
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(60, 3), pg_temp.at(60, 4), 'confirmed', '[test] before connect', ella);
  PERFORM pg_temp.chk('no chat → nothing queued', '∅', COALESCE((SELECT string_agg(kind, ',') FROM public.notifications WHERE id > mark), '∅'));

  PERFORM pg_temp.chk('wrong code', 'false',
    pg_temp.run('service_role', NULL, $$SELECT public.telegram_connect('ZZZZZZ', -100123, 7, 'Band')$$));
  PERFORM pg_temp.chk('right code (any case) connects the chat', 'true',
    pg_temp.run('service_role', NULL, format($$SELECT public.telegram_connect(%L, -100123, 7, 'Band')$$, lower(code))));
  PERFORM pg_temp.chk('chat, topic and title saved; code used up', '-100123/7/Band/∅',
    (SELECT chat_id || '/' || thread_id || '/' || chat_title || '/' || COALESCE(connect_code, '∅') FROM public.studio_telegram WHERE id = 1));
  PERFORM pg_temp.chk('the same code cannot be used twice', 'false',
    pg_temp.run('service_role', NULL, format($$SELECT public.telegram_connect(%L, -100999, NULL, 'Other')$$, code)));

  -- ------------------------------------------------------------ queue
  PERFORM pg_temp.run('authenticated', ella,
    format($$SELECT status FROM public.create_booking(%L, 2, '[test] ella')$$, pg_temp.at(26, 22)));
  SELECT id INTO b1 FROM public.bookings WHERE purpose = '[test] ella';
  PERFORM pg_temp.run('authenticated', ella, format($$SELECT status FROM public.cancel_booking(%L)$$, b1));
  PERFORM pg_temp.run('authenticated', adm,
    format($$SELECT status FROM public.admin_create_booking('block', %L, 1, NULL, NULL, NULL, 'Rehearsal', '[test] block')$$, pg_temp.at(62, 3)));
  INSERT INTO public.bookings (starts_at, ends_at, status, expires_at, purpose, user_id)
  VALUES (pg_temp.at(62, 4), pg_temp.at(62, 5), 'pending', NOW() + INTERVAL '1 day', '[test] request', ella);
  PERFORM pg_temp.run('authenticated', adm,
    format($$SELECT status FROM public.approve_booking(%L)$$, (SELECT id FROM public.bookings WHERE purpose = '[test] request')));
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(-60, 3), pg_temp.at(-60, 4), 'confirmed', '[test] history', ella);

  PERFORM pg_temp.chk('events queued in order (past booking skipped)', 'booked,cancelled:confirmed,closed,requested,approved:pending',
    pg_temp.run('postgres', NULL, format(queue, mark)));

  -- ------------------------------------------------------------ claim / mark
  PERFORM pg_temp.chk('website user cannot read the queue', 'permission denied for function telegram_claim_notifications',
    pg_temp.run('authenticated', adm, 'SELECT count(*) FROM public.telegram_claim_notifications()'));
  PERFORM pg_temp.chk('claim: who and where for the first message', 'booked/Эля/owner/-100123/7',
    pg_temp.run('service_role', NULL,
      $$SELECT kind || '/' || first_name || '/' || CASE WHEN by_owner THEN 'owner' WHEN by_admin THEN 'admin' ELSE '?' END || '/' || chat_id || '/' || thread_id
        FROM public.telegram_claim_notifications(1)$$));
  PERFORM pg_temp.chk('claimed message is not handed out again at once', 'cancelled:confirmed',
    pg_temp.run('service_role', NULL, 'SELECT kind || '':'' || prev_status FROM public.telegram_claim_notifications(1)'));
  PERFORM pg_temp.run('service_role', NULL,
    format('SELECT public.telegram_mark_sent(%s)', (SELECT min(id) FROM public.notifications WHERE id > mark)));
  PERFORM pg_temp.run('service_role', NULL,
    format($$SELECT public.telegram_mark_sent(%s, 'Too Many Requests')$$, (SELECT min(id) + 1 FROM public.notifications WHERE id > mark)));
  PERFORM pg_temp.chk('sent / failed (failed is free for a retry)', 'sent,error:Too Many Requests',
    (SELECT string_agg(CASE WHEN sent_at IS NOT NULL THEN 'sent' ELSE 'error:' || last_error || CASE WHEN claimed_at IS NULL THEN '' ELSE '(still claimed)' END END, ',' ORDER BY id)
     FROM (SELECT * FROM public.notifications WHERE id > mark ORDER BY id LIMIT 2) x));
  PERFORM pg_temp.chk('the closed time is by the admin', 'closed/admin/Rehearsal',
    pg_temp.run('service_role', NULL,
      $$SELECT kind || '/' || CASE WHEN by_admin THEN 'admin' ELSE 'not admin' END || '/' || label
        FROM public.telegram_claim_notifications(10) WHERE kind = 'closed'$$));

  -- ------------------------------------------------------------ test message / disconnect
  PERFORM pg_temp.run('authenticated', adm, 'SELECT public.send_telegram_test()');
  PERFORM pg_temp.chk('test message queued', 'test',
    (SELECT kind FROM public.notifications WHERE id > mark ORDER BY id DESC LIMIT 1));
  PERFORM pg_temp.run('authenticated', adm, 'SELECT public.disconnect_telegram()');
  PERFORM pg_temp.chk('disconnect: chat cleared, unsent dropped', '∅/1',
    COALESCE((SELECT chat_id::TEXT FROM public.studio_telegram WHERE id = 1), '∅') || '/' ||
    (SELECT count(*) FROM public.notifications WHERE id > mark)::TEXT);

  -- ------------------------------------------------------------ cleanup
  DELETE FROM public.notifications WHERE id > mark;
  DELETE FROM public.bookings WHERE purpose LIKE '[test]%';
  DELETE FROM auth.users WHERE id IN (ella, adm);
  UPDATE public.studio_telegram
  SET chat_id = saved.chat_id, thread_id = saved.thread_id, chat_title = saved.chat_title,
      connected_at = saved.connected_at, connect_code = saved.connect_code,
      connect_code_expires_at = saved.connect_code_expires_at,
      bot_username = saved.bot_username, notify_url = saved.notify_url
  WHERE id = 1;
END
$test$;

SELECT n, check_name, expected, got, CASE WHEN got = expected THEN '✅' ELSE '❌' END AS ok
FROM _results
ORDER BY n;
