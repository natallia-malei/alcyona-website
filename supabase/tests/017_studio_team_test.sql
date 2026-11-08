-- Tests for 017_studio_team (role 'member': no limits, names visible, roles).
-- Needs 012–017 applied.
-- Run in Supabase Dashboard → SQL Editor → Run. Result: one table
-- "check | expected | got | ok" — every row should be ✅.
--
-- The Telegram chat is switched off for the run (and restored after), so the
-- test bookings don't post to the band's group.
--
-- Creates 3 temporary users, acts as each of them, then deletes the users and
-- every booking it made (purpose starts with "[test]"). If anything fails
-- midway, the whole run is rolled back.
-- Uses 03:00–05:00 slots 40–45 days ahead (studio closed then) and the hour
-- starting 3 hours from now.

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
  ella UUID := 'e0000000-0000-4000-8000-0000000000e1';  -- band member: name only
  carl UUID := 'e0000000-0000-4000-8000-0000000000c1';  -- client (rental rules)
  adm  UUID := 'e0000000-0000-4000-8000-0000000000ad';  -- admin
  soon TIMESTAMPTZ := date_trunc('hour', NOW()) + INTERVAL '3 hours';
  q TEXT := $$SELECT status FROM public.create_booking(%L, %s, %L)$$;
  cal CONSTANT TEXT := $$SELECT string_agg(COALESCE(title, '∅'), ' | ' ORDER BY starts_at) FROM public.get_calendar(%L, %L)$$;
  saved_chat BIGINT;
BEGIN
  SELECT chat_id INTO saved_chat FROM public.studio_telegram WHERE id = 1;
  UPDATE public.studio_telegram SET chat_id = NULL WHERE id = 1;   -- no Telegram posts during the test

  INSERT INTO auth.users (id, email, aud, role) VALUES
    (ella, 'test-ella@example.invalid',  'authenticated', 'authenticated'),
    (carl, 'test-carl@example.invalid',  'authenticated', 'authenticated'),
    (adm,  'test-admin@example.invalid', 'authenticated', 'authenticated');
  -- Ella: no phone, no consent, doesn't tick "show my name"
  UPDATE public.profiles SET first_name = 'Ella', last_name = 'Test', role = 'client' WHERE id = ella;
  UPDATE public.profiles SET first_name = 'Carl', last_name = 'Test', phone = '+375290000002', privacy_consent_at = NOW(), role = 'client' WHERE id = carl;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Admin', phone = '+375290000005', role = 'admin' WHERE id = adm;

  -- ------------------------------------------------------------ roles
  PERFORM pg_temp.chk('client cannot change roles', 'forbidden',
    pg_temp.run('authenticated', carl, format($$SELECT public.set_client_role(%L, 'member')$$, carl)));
  PERFORM pg_temp.chk('role must be client or member', 'invalid_role',
    pg_temp.run('authenticated', adm, format($$SELECT public.set_client_role(%L, 'admin')$$, ella)));
  PERFORM pg_temp.chk('admin role cannot be changed here', 'cannot_change_admin',
    pg_temp.run('authenticated', adm, format($$SELECT public.set_client_role(%L, 'client')$$, adm)));
  PERFORM pg_temp.chk('before: Ella as a client needs a phone', 'profile_incomplete',
    pg_temp.run('authenticated', ella, format(q, pg_temp.at(40, 10), 2, '[test] x')));
  PERFORM pg_temp.run('authenticated', adm, format($$SELECT public.set_client_role(%L, 'member')$$, ella));
  PERFORM pg_temp.chk('admin adds Ella to the band', 'member', (SELECT role FROM public.profiles WHERE id = ella));
  PERFORM pg_temp.chk('client cannot make themselves a member', 'Only admin can change role, trusted, no_show_count or blocked',
    pg_temp.run('authenticated', carl, format($$UPDATE public.profiles SET role = 'member' WHERE id = %L RETURNING role$$, carl)));

  -- ------------------------------------------------------------ member books without limits
  PERFORM pg_temp.chk('member: 1 h at 03:00, 40 days ahead, no purpose → confirmed', 'confirmed',
    pg_temp.run('authenticated', ella, format(q, pg_temp.at(40, 3), 1, NULL)));
  PERFORM pg_temp.chk('member: 6 h → confirmed', 'confirmed',
    pg_temp.run('authenticated', ella, format(q, pg_temp.at(41, 3), 6, '[test] ella 2')));
  PERFORM pg_temp.chk('member: 3rd booking', 'confirmed',
    pg_temp.run('authenticated', ella, format(q, pg_temp.at(42, 3), 1, '[test] ella 3')));
  PERFORM pg_temp.chk('member: 4th booking — no limit', 'confirmed',
    pg_temp.run('authenticated', ella, format(q, pg_temp.at(43, 3), 1, '[test] ella 4')));
  UPDATE public.bookings SET purpose = '[test] ella 1' WHERE user_id = ella AND purpose IS NULL;

  -- client keeps the rental rules
  PERFORM pg_temp.chk('client: 1 h is still too short', 'invalid_duration',
    pg_temp.run('authenticated', carl, format(q, pg_temp.at(20, 10), 1, '[test] carl')));
  PERFORM pg_temp.chk('client: still needs "what we will do"', 'purpose_required',
    pg_temp.run('authenticated', carl, format(q, pg_temp.at(20, 10), 2, NULL)));

  -- ------------------------------------------------------------ cancel any time
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (soon, soon + INTERVAL '1 hour', 'confirmed', '[test] ella soon', ella);
  PERFORM pg_temp.chk('member cancels own booking < 24 h before', 'cancelled',
    pg_temp.run('authenticated', ella,
      $$SELECT status FROM public.cancel_booking((SELECT id FROM public.bookings WHERE purpose = '[test] ella soon'))$$));
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(44, 3), pg_temp.at(44, 4), 'confirmed', '[test] carl far', carl);
  PERFORM pg_temp.chk('member cannot cancel someone else''s booking', 'not_found',
    pg_temp.run('authenticated', ella,
      $$SELECT status FROM public.cancel_booking((SELECT id FROM public.bookings WHERE purpose = '[test] carl far'))$$));

  -- ------------------------------------------------------------ names in the calendar
  PERFORM pg_temp.chk('a client sees the member''s name', 'Ella Test',
    pg_temp.run('authenticated', carl, format(cal, pg_temp.at(42, 0), pg_temp.at(43, 0))));
  PERFORM pg_temp.chk('a visitor cannot read the calendar (018)', 'permission denied for function get_calendar',
    pg_temp.run('anon', NULL, format(cal, pg_temp.at(42, 0), pg_temp.at(43, 0))));
  PERFORM pg_temp.chk('the member does not see a client''s name (no consent to show it)', '∅',
    pg_temp.run('authenticated', ella, format(cal, pg_temp.at(44, 0), pg_temp.at(45, 0))));

  -- ------------------------------------------------------------ back to client
  PERFORM pg_temp.run('authenticated', adm, format($$SELECT public.set_client_role(%L, 'client')$$, ella));
  PERFORM pg_temp.chk('removed from the band → client rules again', 'profile_incomplete',
    pg_temp.run('authenticated', ella, format(q, pg_temp.at(45, 3), 1, '[test] x')));

  -- ------------------------------------------------------------ cleanup
  DELETE FROM public.bookings WHERE purpose LIKE '[test]%';
  DELETE FROM auth.users WHERE id IN (ella, carl, adm);
  UPDATE public.studio_telegram SET chat_id = saved_chat WHERE id = 1;
END
$test$;

SELECT n, check_name, expected, got, CASE WHEN got = expected THEN '✅' ELSE '❌' END AS ok
FROM _results
ORDER BY n;
