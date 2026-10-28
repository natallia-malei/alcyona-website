-- Tests for 012_bookings + 013_privacy_consent
-- (create_booking / cancel_booking / get_calendar). Needs both applied.
-- Run in Supabase Dashboard → SQL Editor → Run. Result: one table
-- "check | expected | got | ok" — every row should be ✅.
--
-- What it does: creates 5 temporary test users (+ their profiles), acts as
-- each of them like the website would, then deletes the users and every
-- booking it made (purpose starts with "[test]"). If anything fails midway,
-- the whole run is rolled back — nothing stays in the database.
--
-- Uses slots 20–27 days ahead at 10:00–14:00 and the nearest free hour.
-- If a real booking sits there, some checks show slot_taken instead.
-- Not covered here: two people pressing "Book" at the same moment —
-- that needs two parallel connections.

DROP TABLE IF EXISTS pg_temp._results;
CREATE TEMP TABLE _results (n SERIAL, check_name TEXT, expected TEXT, got TEXT);

-- Local Minsk date + hour → timestamptz (d = days from today)
CREATE OR REPLACE FUNCTION pg_temp.at(d INTEGER, h INTEGER) RETURNS TIMESTAMPTZ
LANGUAGE sql STABLE AS $$
  SELECT ((NOW() AT TIME ZONE 'Europe/Minsk')::DATE + d + make_interval(hours => h)) AT TIME ZONE 'Europe/Minsk'
$$;

-- Runs q as the given role/user (like a request from the website) and returns
-- its single value, or the error message. The role switch is undone after.
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
  anna  UUID := 'b0000000-0000-4000-8000-00000000000a';  -- newbie, shows name in calendar
  boris UUID := 'b0000000-0000-4000-8000-00000000000b';  -- trusted, hides name
  cyril UUID := 'b0000000-0000-4000-8000-00000000000c';  -- profile incomplete
  dan   UUID := 'b0000000-0000-4000-8000-00000000000d';  -- blocked
  adm   UUID := 'b0000000-0000-4000-8000-0000000000ad';  -- admin
  old_cutoff SMALLINT;
  soon TIMESTAMPTZ;
  q TEXT;
  -- "what each viewer sees" for a day: title/status/purpose per booking
  cal CONSTANT TEXT := $$SELECT string_agg(COALESCE(title, '∅') || '/' || COALESCE(status, '∅') || '/' || COALESCE(purpose, '∅'), ' | ' ORDER BY starts_at) FROM public.get_calendar(%L, %L)$$;
BEGIN
  -- ------------------------------------------------------------------ setup
  INSERT INTO auth.users (id, email, aud, role) VALUES
    (anna,  'test-anna@example.invalid',  'authenticated', 'authenticated'),
    (boris, 'test-boris@example.invalid', 'authenticated', 'authenticated'),
    (cyril, 'test-cyril@example.invalid', 'authenticated', 'authenticated'),
    (dan,   'test-dan@example.invalid',   'authenticated', 'authenticated'),
    (adm,   'test-admin@example.invalid', 'authenticated', 'authenticated');
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Anna',  phone = '+375290000001', show_full_name = TRUE WHERE id = anna;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Boris', phone = '+375290000002', trusted = TRUE      WHERE id = boris;
  UPDATE public.profiles SET first_name = 'Test'                                                                    WHERE id = cyril;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Dan',   phone = '+375290000004', blocked = TRUE      WHERE id = dan;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Admin', phone = '+375290000005', role = 'admin'      WHERE id = adm;
  UPDATE public.profiles SET privacy_consent_at = NOW() WHERE id IN (anna, boris, dan);   -- admin needs no consent

  -- ------------------------------------------------- who may create at all
  q := format($$SELECT status FROM public.create_booking(%L, 2, '[test]')$$, pg_temp.at(20, 10));
  PERFORM pg_temp.chk('guest (not signed in) cannot book', 'permission denied for function create_booking', pg_temp.run('anon', NULL, q));
  PERFORM pg_temp.chk('incomplete profile cannot book', 'profile_incomplete', pg_temp.run('authenticated', cyril, q));
  PERFORM pg_temp.chk('blocked client cannot book',     'blocked',            pg_temp.run('authenticated', dan, q));
  UPDATE public.profiles SET privacy_consent_at = NULL WHERE id = anna;
  PERFORM pg_temp.chk('no consent to data processing',  'consent_required',   pg_temp.run('authenticated', anna, q));
  UPDATE public.profiles SET privacy_consent_at = NOW() WHERE id = anna;

  -- ------------------------------------------------------- booking rules
  q := $$SELECT status FROM public.create_booking(%L, %s, %L)$$;
  PERFORM pg_temp.chk('1 hour is too short',        'invalid_duration', pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 10), 1, '[test]')));
  PERFORM pg_temp.chk('5 hours is too long',        'invalid_duration', pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 10), 5, '[test]')));
  PERFORM pg_temp.chk('start at 7:00',              'outside_hours',    pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 7), 2, '[test]')));
  PERFORM pg_temp.chk('23:00–01:00 (past midnight)','outside_hours',    pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 23), 2, '[test]')));
  PERFORM pg_temp.chk('start at 10:30',             'invalid_start',    pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 10) + INTERVAL '30 min', 2, '[test]')));
  PERFORM pg_temp.chk('yesterday',                  'in_the_past',      pg_temp.run('authenticated', anna, format(q, pg_temp.at(-1, 10), 2, '[test]')));
  PERFORM pg_temp.chk('28 days ahead',              'beyond_horizon',   pg_temp.run('authenticated', anna, format(q, pg_temp.at(28, 10), 2, '[test]')));
  PERFORM pg_temp.chk('empty "what we''ll do"',     'purpose_required', pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 10), 2, '   ')));
  PERFORM pg_temp.chk('201 characters',             'purpose_too_long', pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 10), 2, '[test]' || repeat('a', 195))));

  PERFORM pg_temp.chk('newbie → request (day 20, 10–12)', 'pending', pg_temp.run('authenticated', anna, format(q, pg_temp.at(20, 10), 2, '[test] anna 1')));
  PERFORM pg_temp.chk('newbie 2nd (day 21)',              'pending', pg_temp.run('authenticated', anna, format(q, pg_temp.at(21, 10), 2, '[test] anna 2')));
  PERFORM pg_temp.chk('newbie 3rd (day 22)',              'pending', pg_temp.run('authenticated', anna, format(q, pg_temp.at(22, 10), 2, '[test] anna 3')));
  PERFORM pg_temp.chk('4th future booking',          'limit_reached', pg_temp.run('authenticated', anna, format(q, pg_temp.at(23, 10), 2, '[test]')));

  PERFORM pg_temp.chk('overlap with a request (11–13)', 'slot_taken', pg_temp.run('authenticated', boris, format(q, pg_temp.at(20, 11), 2, '[test]')));
  PERFORM pg_temp.chk('trusted → confirmed right away, back to back (12–14)', 'confirmed', pg_temp.run('authenticated', boris, format(q, pg_temp.at(20, 12), 2, '[test] boris')));

  -- ----------------------------------------------------------- visibility
  q := format(cal, pg_temp.at(20, 0), pg_temp.at(21, 0));
  PERFORM pg_temp.chk('guest sees only "busy"', '∅/∅/∅ | ∅/∅/∅', pg_temp.run('anon', NULL, q));
  PERFORM pg_temp.chk('Boris sees Anna''s name (shown), own status + purpose',
    'Test Anna/∅/∅ | Test Boris/confirmed/[test] boris', pg_temp.run('authenticated', boris, q));
  PERFORM pg_temp.chk('Anna does not see Boris''s name (hidden)',
    'Test Anna/pending/[test] anna 1 | ∅/∅/∅', pg_temp.run('authenticated', anna, q));
  PERFORM pg_temp.chk('admin sees everything',
    'Test Anna/pending/[test] anna 1 | Test Boris/confirmed/[test] boris', pg_temp.run('authenticated', adm, q));
  PERFORM pg_temp.chk('calendar range > 62 days', 'invalid_range',
    pg_temp.run('anon', NULL, format($$SELECT count(*) FROM public.get_calendar(%L, %L)$$, NOW(), NOW() + INTERVAL '100 days')));

  -- -------------------------------------------- no direct table access
  PERFORM pg_temp.chk('guest reads bookings table directly', '0',
    pg_temp.run('anon', NULL, $$SELECT count(*) FROM public.bookings$$));
  PERFORM pg_temp.chk('client reads only own rows', '3',
    pg_temp.run('authenticated', anna, $$SELECT count(*) FROM public.bookings$$));
  PERFORM pg_temp.chk('client cannot confirm own request directly', '0',
    pg_temp.run('authenticated', anna, $$WITH u AS (UPDATE public.bookings SET status = 'confirmed' RETURNING 1) SELECT count(*) FROM u$$));

  -- ---------------------------------------------------------- cancelling
  q := $$SELECT status FROM public.cancel_booking((SELECT id FROM public.bookings WHERE purpose = %L))$$;
  PERFORM pg_temp.chk('withdraw own request',        'cancelled',  pg_temp.run('authenticated', anna, format(q, '[test] anna 3')));
  PERFORM pg_temp.chk('cancel it again',             'not_active', pg_temp.run('authenticated', anna, format(q, '[test] anna 3')));
  PERFORM pg_temp.chk('cancel someone else''s booking', 'not_found',
    pg_temp.run('authenticated', anna, format($$SELECT status FROM public.cancel_booking(%L)$$,
      (SELECT id FROM public.bookings WHERE purpose = '[test] boris'))));
  PERFORM pg_temp.chk('cancel 20 days ahead',        'cancelled',  pg_temp.run('authenticated', boris, format(q, '[test] boris')));

  -- nearest bookable hour (≥ 1 h from now, start 8:00–22:00) → < 24 h ahead
  soon := date_trunc('hour', NOW()) + INTERVAL '2 hours';
  WHILE extract(HOUR FROM soon AT TIME ZONE 'Europe/Minsk') NOT BETWEEN 8 AND 22 LOOP
    soon := soon + INTERVAL '1 hour';
  END LOOP;
  PERFORM pg_temp.chk('trusted books the nearest free hour', 'confirmed',
    pg_temp.run('authenticated', boris, format($$SELECT status FROM public.create_booking(%L, 2, '[test] soon')$$, soon)));
  PERFORM pg_temp.chk('client cancels < 24 h before', 'too_late_to_cancel', pg_temp.run('authenticated', boris, format(q, '[test] soon')));
  PERFORM pg_temp.chk('admin cancels < 24 h before',  'cancelled',          pg_temp.run('authenticated', adm,   format(q, '[test] soon')));

  -- --------------------------------------------- request too close to start
  SELECT request_cutoff_hours INTO old_cutoff FROM public.studio_settings WHERE id = 1;
  UPDATE public.studio_settings SET request_cutoff_hours = 1000 WHERE id = 1;
  PERFORM pg_temp.chk('request that would expire immediately', 'too_late_for_request',
    pg_temp.run('authenticated', anna, format($$SELECT status FROM public.create_booking(%L, 2, '[test]')$$, pg_temp.at(24, 10))));
  UPDATE public.studio_settings SET request_cutoff_hours = old_cutoff WHERE id = 1;

  -- ------------------------------------------------- expired request frees the slot
  UPDATE public.bookings SET expires_at = NOW() - INTERVAL '1 second' WHERE purpose = '[test] anna 2';
  PERFORM pg_temp.chk('expired request disappears from calendar', '0',
    pg_temp.run('anon', NULL, format($$SELECT count(*) FROM public.get_calendar(%L, %L)$$, pg_temp.at(21, 0), pg_temp.at(22, 0))));
  PERFORM pg_temp.chk('someone else takes the freed slot', 'confirmed',
    pg_temp.run('authenticated', boris, format($$SELECT status FROM public.create_booking(%L, 2, '[test] boris 2')$$, pg_temp.at(21, 10))));
  PERFORM pg_temp.chk('the old request is marked expired', 'expired',
    (SELECT status FROM public.bookings WHERE purpose = '[test] anna 2'));

  -- ------------------------------------------------------------- admin
  PERFORM pg_temp.chk('admin: no limits (40 days ahead, 6:00, 6 h)', 'confirmed',
    pg_temp.run('authenticated', adm, format($$SELECT status FROM public.create_booking(%L, 6, '[test] admin')$$, pg_temp.at(40, 6))));

  -- --------------------------------------------------- account deleted
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(-3, 10), pg_temp.at(-3, 12), 'confirmed', '[test] anna past', anna);
  DELETE FROM auth.users WHERE id = anna;
  PERFORM pg_temp.chk('deleted account: future request cancelled', 'cancelled/no user',
    (SELECT status || CASE WHEN user_id IS NULL THEN '/no user' ELSE '/HAS USER' END FROM public.bookings WHERE purpose = '[test] anna 1'));
  PERFORM pg_temp.chk('deleted account: past booking shows "Deleted user"', 'deleted',
    pg_temp.run('authenticated', boris, format($$SELECT string_agg(kind, ',') FROM public.get_calendar(%L, %L)$$, pg_temp.at(-3, 0), pg_temp.at(-2, 0))));

  -- ------------------------------------------------------------ cleanup
  DELETE FROM public.bookings WHERE purpose LIKE '[test]%';
  DELETE FROM auth.users WHERE id IN (anna, boris, cyril, dan, adm);
END
$test$;

SELECT n, check_name, expected, got, CASE WHEN got = expected THEN '✅' ELSE '❌' END AS ok
FROM _results
ORDER BY n;
