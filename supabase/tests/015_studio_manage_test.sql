-- Tests for 015_studio_manage (approve/reject, admin_create_booking,
-- mark_attendance, set_client_trusted/blocked, get_clients). Needs 012–015 applied.
-- Run in Supabase Dashboard → SQL Editor → Run. Result: one table
-- "check | expected | got | ok" — every row should be ✅.
--
-- What it does: creates 4 temporary test users (+ profiles), acts as each of
-- them like the website would, then deletes the users and every booking it
-- made (purpose starts with "[test]"). If anything fails midway, the whole
-- run is rolled back — nothing stays in the database.
--
-- Uses 03:00–05:00 slots 40–55 days back and ahead — the studio is closed
-- then, so real bookings shouldn't be in the way.

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
  anna  UUID := 'c0000000-0000-4000-8000-00000000000a';  -- newbie
  boris UUID := 'c0000000-0000-4000-8000-00000000000b';  -- trusted
  eve   UUID := 'c0000000-0000-4000-8000-00000000000e';  -- gets blocked
  adm   UUID := 'c0000000-0000-4000-8000-0000000000ad';  -- admin
  req1 UUID; req2 UUID; req3 UUID;
  past_anna UUID; past_b1 UUID; past_b2 UUID;
  q TEXT;
  -- "who/what" of a day as the viewer sees it: kind/title per booking
  cal CONSTANT TEXT := $$SELECT string_agg(COALESCE(kind, '∅') || '/' || COALESCE(title, '∅'), ' | ' ORDER BY starts_at) FROM public.get_calendar(%L, %L)$$;
  counters CONSTANT TEXT := 'SELECT no_show_count || ''/'' || trusted FROM public.profiles WHERE id = %L';
BEGIN
  -- ------------------------------------------------------------------ setup
  INSERT INTO auth.users (id, email, aud, role) VALUES
    (anna,  'test-anna@example.invalid',  'authenticated', 'authenticated'),
    (boris, 'test-boris@example.invalid', 'authenticated', 'authenticated'),
    (eve,   'test-eve@example.invalid',   'authenticated', 'authenticated'),
    (adm,   'test-admin@example.invalid', 'authenticated', 'authenticated');
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Anna',  phone = '+375290000001' WHERE id = anna;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Boris', phone = '+375290000002', trusted = TRUE WHERE id = boris;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Eve',   phone = '+375290000003' WHERE id = eve;
  UPDATE public.profiles SET first_name = 'Test', last_name = 'Admin', phone = '+375290000005', role = 'admin' WHERE id = adm;
  UPDATE public.profiles SET privacy_consent_at = NOW() WHERE id IN (anna, boris, eve);

  -- Requests are inserted directly: create_booking itself is covered by 012
  INSERT INTO public.bookings (starts_at, ends_at, status, expires_at, purpose, user_id)
  VALUES (pg_temp.at(50, 3), pg_temp.at(50, 5), 'pending', NOW() + INTERVAL '1 day', '[test] anna req1', anna)
  RETURNING id INTO req1;
  INSERT INTO public.bookings (starts_at, ends_at, status, expires_at, purpose, user_id)
  VALUES (pg_temp.at(51, 3), pg_temp.at(51, 5), 'pending', NOW() - INTERVAL '1 second', '[test] anna overdue', anna)
  RETURNING id INTO req2;
  INSERT INTO public.bookings (starts_at, ends_at, status, expires_at, purpose, user_id)
  VALUES (pg_temp.at(52, 3), pg_temp.at(52, 5), 'pending', NOW() + INTERVAL '1 day', '[test] anna req3', anna)
  RETURNING id INTO req3;

  -- ------------------------------------------------------ approve / reject
  q := format($$SELECT status FROM public.approve_booking(%L)$$, req1);
  PERFORM pg_temp.chk('anonymous cannot approve', 'permission denied for function approve_booking', pg_temp.run('anon', NULL, q));
  PERFORM pg_temp.chk('client cannot approve',     'forbidden',  pg_temp.run('authenticated', anna, q));
  PERFORM pg_temp.chk('admin approves a request',  'confirmed',  pg_temp.run('authenticated', adm, q));
  PERFORM pg_temp.chk('approved: no expiry left',  '∅',
    COALESCE((SELECT expires_at::TEXT FROM public.bookings WHERE id = req1), '∅'));
  PERFORM pg_temp.chk('approve twice',             'not_pending', pg_temp.run('authenticated', adm, q));
  PERFORM pg_temp.chk('approve an overdue request', 'request_expired',
    pg_temp.run('authenticated', adm, format($$SELECT status FROM public.approve_booking(%L)$$, req2)));
  PERFORM pg_temp.chk('admin rejects a request',   'rejected',
    pg_temp.run('authenticated', adm, format($$SELECT status FROM public.reject_booking(%L)$$, req3)));
  PERFORM pg_temp.chk('client sees the rejection in own bookings', 'rejected',
    pg_temp.run('authenticated', anna, format($$SELECT status FROM public.bookings WHERE id = %L$$, req3)));
  PERFORM pg_temp.chk('reject a confirmed booking', 'not_pending',
    pg_temp.run('authenticated', adm, format($$SELECT status FROM public.reject_booking(%L)$$, req1)));

  -- --------------------------------------------------- admin_create_booking
  q := $$SELECT status FROM public.admin_create_booking(%L, %L, %s, %L, %L, %L, %L, %L)$$;
  PERFORM pg_temp.chk('client cannot use admin_create_booking', 'forbidden',
    pg_temp.run('authenticated', boris, format(q, 'block', pg_temp.at(53, 3), 2, NULL, NULL, NULL, NULL, '[test] x')));
  PERFORM pg_temp.chk('guest without phone', 'guest_required',
    pg_temp.run('authenticated', adm, format(q, 'guest', pg_temp.at(53, 3), 2, NULL, 'Guest Ivan', '', NULL, '[test] guest')));
  PERFORM pg_temp.chk('unknown kind', 'invalid_kind',
    pg_temp.run('authenticated', adm, format(q, 'party', pg_temp.at(53, 3), 2, NULL, NULL, NULL, NULL, '[test] x')));
  PERFORM pg_temp.chk('in the past', 'in_the_past',
    pg_temp.run('authenticated', adm, format(q, 'block', pg_temp.at(-1, 3), 2, NULL, NULL, NULL, NULL, '[test] x')));
  PERFORM pg_temp.chk('admin books for a guest', 'confirmed',
    pg_temp.run('authenticated', adm, format(q, 'guest', pg_temp.at(53, 3), 2, NULL, 'Guest Ivan', '+375291111111', NULL, '[test] guest')));
  PERFORM pg_temp.chk('admin closes time without a caption', 'confirmed',
    pg_temp.run('authenticated', adm, format(q, 'block', pg_temp.at(53, 5), 1, NULL, NULL, NULL, '  ', '[test] block')));
  PERFORM pg_temp.chk('admin sees the guest name and the empty caption', 'guest/Guest Ivan | admin/',
    pg_temp.run('authenticated', adm, format(cal, pg_temp.at(53, 0), pg_temp.at(54, 0))));
  PERFORM pg_temp.chk('client sees "busy" for both', 'guest/∅ | admin/',
    pg_temp.run('authenticated', boris, format(cal, pg_temp.at(53, 0), pg_temp.at(54, 0))));
  PERFORM pg_temp.chk('closing time over a booking', 'slot_taken',
    pg_temp.run('authenticated', adm, format(q, 'block', pg_temp.at(53, 4), 1, NULL, NULL, NULL, 'Rehearsal', '[test] block 2')));
  PERFORM pg_temp.chk('admin books for a client', 'confirmed',
    pg_temp.run('authenticated', adm, format(q, 'client', pg_temp.at(54, 3), 2, anna, NULL, NULL, NULL, '[test] for anna')));
  PERFORM pg_temp.chk('the client sees it in own bookings', 'confirmed',
    pg_temp.run('authenticated', anna, $$SELECT status FROM public.bookings WHERE purpose = '[test] for anna'$$));
  PERFORM pg_temp.chk('client kind without a client', 'client_required',
    pg_temp.run('authenticated', adm, format(q, 'client', pg_temp.at(54, 5), 1, NULL, NULL, NULL, NULL, '[test] x')));

  -- ------------------------------------------------------- mark_attendance
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(-40, 3), pg_temp.at(-40, 5), 'confirmed', '[test] anna past', anna) RETURNING id INTO past_anna;
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(-41, 3), pg_temp.at(-41, 5), 'confirmed', '[test] boris past 1', boris) RETURNING id INTO past_b1;
  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(-42, 3), pg_temp.at(-42, 5), 'confirmed', '[test] boris past 2', boris) RETURNING id INTO past_b2;

  q := $$SELECT attended FROM public.mark_attendance(%L, %L)$$;
  PERFORM pg_temp.chk('client cannot mark attendance', 'forbidden',
    pg_temp.run('authenticated', anna, format(q, past_anna, TRUE)));
  PERFORM pg_temp.chk('cannot mark a booking that has not started', 'not_started',
    pg_temp.run('authenticated', adm, format(q, req1, TRUE)));
  PERFORM pg_temp.chk('cannot mark a rejected request', 'not_confirmed',
    pg_temp.run('authenticated', adm, format(q, req3, TRUE)));

  PERFORM pg_temp.run('authenticated', adm, format(q, past_anna, TRUE));
  PERFORM pg_temp.chk('newbie came for the first time → trusted', '0/true',
    pg_temp.run('authenticated', adm, format(counters, anna)));

  PERFORM pg_temp.run('authenticated', adm, format(q, past_b1, FALSE));
  PERFORM pg_temp.chk('trusted client: 1st no-show', '1/true',
    pg_temp.run('authenticated', adm, format(counters, boris)));
  PERFORM pg_temp.run('authenticated', adm, format(q, past_b1, FALSE));
  PERFORM pg_temp.chk('same mark again is not counted twice', '1/true',
    pg_temp.run('authenticated', adm, format(counters, boris)));
  PERFORM pg_temp.run('authenticated', adm, format(q, past_b2, FALSE));
  PERFORM pg_temp.chk('2nd no-show → trust lost', '2/false',
    pg_temp.run('authenticated', adm, format(counters, boris)));
  PERFORM pg_temp.run('authenticated', adm, format(q, past_b2, NULL));
  PERFORM pg_temp.chk('clearing a no-show takes it off the counter', '1/false',
    pg_temp.run('authenticated', adm, format(counters, boris)));
  PERFORM pg_temp.run('authenticated', adm, format(q, past_b2, TRUE));
  PERFORM pg_temp.chk('first "came" with no-shows below the limit → trusted', '1/true',
    pg_temp.run('authenticated', adm, format(counters, boris)));

  -- ------------------------------------------------- trust / block by hand
  PERFORM pg_temp.chk('client cannot change trust', 'forbidden',
    pg_temp.run('authenticated', boris, format($$SELECT public.set_client_trusted(%L, TRUE)$$, boris)));
  PERFORM pg_temp.run('authenticated', adm, format($$SELECT public.set_client_trusted(%L, FALSE)$$, boris));
  PERFORM pg_temp.chk('admin removes trust, counter stays', '1/false',
    pg_temp.run('authenticated', adm, format(counters, boris)));
  PERFORM pg_temp.run('authenticated', adm, format($$SELECT public.set_client_trusted(%L, TRUE)$$, boris));
  PERFORM pg_temp.chk('returning trust resets the counter', '0/true',
    pg_temp.run('authenticated', adm, format(counters, boris)));

  INSERT INTO public.bookings (starts_at, ends_at, status, purpose, user_id)
  VALUES (pg_temp.at(55, 3), pg_temp.at(55, 4), 'confirmed', '[test] eve 1', eve);
  INSERT INTO public.bookings (starts_at, ends_at, status, expires_at, purpose, user_id)
  VALUES (pg_temp.at(55, 4), pg_temp.at(55, 5), 'pending', NOW() + INTERVAL '1 day', '[test] eve 2', eve);
  q := $$SELECT public.set_client_blocked(%L, %L)$$;
  PERFORM pg_temp.chk('client cannot block', 'forbidden',
    pg_temp.run('authenticated', boris, format(q, eve, TRUE)));
  PERFORM pg_temp.chk('admin cannot be blocked', 'cannot_block_admin',
    pg_temp.run('authenticated', adm, format(q, adm, TRUE)));
  PERFORM pg_temp.chk('blocking cancels future bookings and requests', '2',
    pg_temp.run('authenticated', adm, format(q, eve, TRUE)));
  PERFORM pg_temp.chk('…they are cancelled', 'cancelled,cancelled',
    (SELECT string_agg(status, ',') FROM public.bookings WHERE purpose LIKE '[test] eve%'));
  PERFORM pg_temp.chk('cannot book for a blocked client', 'blocked',
    pg_temp.run('authenticated', adm, format($$SELECT status FROM public.admin_create_booking('client', %L, 1, %L)$$, pg_temp.at(55, 3), eve)));
  PERFORM pg_temp.chk('unblocking cancels nothing', '0',
    pg_temp.run('authenticated', adm, format(q, eve, FALSE)));

  -- ------------------------------------------------------------ get_clients
  q := $$SELECT email || '/' || upcoming_count || '/' || attended_count FROM public.get_clients() WHERE id = %L$$;
  PERFORM pg_temp.chk('anonymous cannot list clients', 'permission denied for function get_clients',
    pg_temp.run('anon', NULL, format(q, anna)));
  PERFORM pg_temp.chk('client cannot list clients', 'forbidden',
    pg_temp.run('authenticated', anna, format(q, anna)));
  PERFORM pg_temp.chk('admin sees email and stats', 'test-anna@example.invalid/2/1',
    pg_temp.run('authenticated', adm, format(q, anna)));

  -- ------------------------------------------------------------ cleanup
  DELETE FROM public.bookings WHERE purpose LIKE '[test]%';
  DELETE FROM auth.users WHERE id IN (anna, boris, eve, adm);
END
$test$;

SELECT n, check_name, expected, got, CASE WHEN got = expected THEN '✅' ELSE '❌' END AS ok
FROM _results
ORDER BY n;
