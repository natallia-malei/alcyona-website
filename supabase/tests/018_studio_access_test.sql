-- Tests for 018_studio_access (role 'applicant', studio access, sign-up message).
-- Needs 012–018 applied.
-- Run in Supabase Dashboard → SQL Editor → Run. Result: one table
-- "check | expected | got | ok" — every row should be ✅.
--
-- Sends nothing to Telegram: the chat is "connected" to a fake id and
-- notify_url is cleared for the run, then the real settings are restored.
-- Creates 2 temporary users and deletes them (and their bookings) at the end.
-- Uses a 03:00–05:00 slot 50 days ahead (studio closed then).

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
  nina UUID := 'f0000000-0000-4000-8000-0000000000a1';  -- new sign-up
  adm  UUID := 'f0000000-0000-4000-8000-0000000000ad';  -- admin
  saved public.studio_telegram;
  mark BIGINT;
  q TEXT := $$SELECT status FROM public.create_booking(%L, 2, '[test] nina')$$;
  cal TEXT := format($$SELECT count(*) FROM public.get_calendar(%L, %L)$$, NOW(), NOW() + INTERVAL '7 days');
BEGIN
  SELECT * INTO saved FROM public.studio_telegram WHERE id = 1;
  SELECT COALESCE(max(id), 0) INTO mark FROM public.notifications;
  -- A fake chat, no notify_url → messages are queued but never sent
  UPDATE public.studio_telegram SET chat_id = -100777, thread_id = NULL, notify_url = NULL WHERE id = 1;

  INSERT INTO auth.users (id, email, aud, role) VALUES
    (nina, 'test-nina@example.invalid',  'authenticated', 'authenticated'),
    (adm,  'test-admin@example.invalid', 'authenticated', 'authenticated');
  UPDATE public.profiles SET first_name = 'Nina', last_name = 'Test', phone = '+375290000001', privacy_consent_at = NOW() WHERE id = nina;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Admin', phone = '+375290000005', role = 'admin' WHERE id = adm;

  -- ------------------------------------------------------------ new sign-up
  PERFORM pg_temp.chk('a new account starts as applicant', 'applicant', (SELECT role FROM public.profiles WHERE id = nina));
  PERFORM pg_temp.chk('"new sign-up" queued for the bot, with the email', 'signup/test-nina@example.invalid',
    pg_temp.run('service_role', NULL,
      $$SELECT kind || '/' || email FROM public.telegram_claim_notifications(10) WHERE kind = 'signup' AND email = 'test-nina@example.invalid'$$));
  PERFORM pg_temp.chk('every new account is announced once (the test admin too)', '1',
    (SELECT count(*)::TEXT FROM public.notifications WHERE id > mark AND kind = 'signup' AND profile_id = adm));

  -- ------------------------------------------------------------ no access
  PERFORM pg_temp.chk('applicant has no studio access', 'false',
    pg_temp.run('authenticated', nina, 'SELECT public.has_studio_access()'));
  PERFORM pg_temp.chk('applicant cannot read the calendar', 'no_access',
    pg_temp.run('authenticated', nina, cal));
  PERFORM pg_temp.chk('applicant cannot book', 'no_access',
    pg_temp.run('authenticated', nina, format(q, pg_temp.at(50, 3))));
  PERFORM pg_temp.chk('visitor cannot read the calendar', 'permission denied for function get_calendar',
    pg_temp.run('anon', NULL, cal));
  PERFORM pg_temp.chk('admin has access', 'true',
    pg_temp.run('authenticated', adm, 'SELECT public.has_studio_access()'));

  -- ------------------------------------------------------------ approve / revoke
  PERFORM pg_temp.chk('applicant cannot approve themselves', 'forbidden',
    pg_temp.run('authenticated', nina, format($$SELECT public.set_client_role(%L, 'client')$$, nina)));
  PERFORM pg_temp.run('authenticated', adm, format($$SELECT public.set_client_role(%L, 'client')$$, nina));
  PERFORM pg_temp.chk('approved → client, has access', 'client/true',
    (SELECT role FROM public.profiles WHERE id = nina) || '/' || pg_temp.run('authenticated', nina, 'SELECT public.has_studio_access()'));
  PERFORM pg_temp.chk('approved client reads the calendar', 'ok',
    CASE WHEN pg_temp.run('authenticated', nina, cal) ~ '^\d+$' THEN 'ok' ELSE pg_temp.run('authenticated', nina, cal) END);
  PERFORM pg_temp.chk('approved client books (rental rules: 03:00 is outside hours)', 'outside_hours',
    pg_temp.run('authenticated', nina, format(q, pg_temp.at(50, 3))));
  PERFORM pg_temp.run('authenticated', adm, format($$SELECT public.set_client_role(%L, 'applicant')$$, nina));
  PERFORM pg_temp.chk('access revoked → applicant again', 'applicant/false',
    (SELECT role FROM public.profiles WHERE id = nina) || '/' || pg_temp.run('authenticated', nina, 'SELECT public.has_studio_access()'));

  -- ------------------------------------------------------------ cleanup
  DELETE FROM public.notifications WHERE id > mark;
  DELETE FROM public.bookings WHERE purpose LIKE '[test]%';
  DELETE FROM auth.users WHERE id IN (nina, adm);
  UPDATE public.studio_telegram
  SET chat_id = saved.chat_id, thread_id = saved.thread_id, notify_url = saved.notify_url
  WHERE id = 1;
END
$test$;

SELECT n, check_name, expected, got, CASE WHEN got = expected THEN '✅' ELSE '❌' END AS ok
FROM _results
ORDER BY n;
