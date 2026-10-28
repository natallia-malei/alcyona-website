-- User profiles + roles for the studio booking calendar.
-- Every auth user gets a profile row (created by trigger on sign-up).
-- role = 'admin' grants write access to the site (see migration 010).
-- Apply in Supabase Dashboard → SQL Editor → Run
--
-- After applying: make yourself admin BEFORE applying 010:
--   UPDATE profiles SET role = 'admin'
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'you@example.com');

-- ============================================================================
-- TABLE
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- filled in by the user during onboarding (NULL until then)
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  telegram_username TEXT CHECK (telegram_username ~ '^[A-Za-z0-9_]{5,32}$'),  -- without "@"
  show_full_name BOOLEAN NOT NULL DEFAULT FALSE,   -- consent to show name in the calendar
  -- managed by admin only (see protect_profile_fields trigger)
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  trusted BOOLEAN NOT NULL DEFAULT FALSE,          -- trusted clients get auto-confirmed bookings
  no_show_count INTEGER NOT NULL DEFAULT 0 CHECK (no_show_count >= 0),
  blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- is_admin()
-- ============================================================================
-- SECURITY DEFINER so it can read profiles regardless of RLS
-- (and so profiles policies can call it without recursion).

CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create a profile on sign-up. Google sign-in provides given/family name —
-- prefill them so the user only has to add the phone.
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NULLIF(NEW.raw_user_meta_data ->> 'given_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'family_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clients may edit their contact fields, but not role/trust/no-shows/block.
-- auth.uid() IS NULL means SQL Editor / service role — allowed.
CREATE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() AND (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.trusted IS DISTINCT FROM OLD.trusted
    OR NEW.no_show_count IS DISTINCT FROM OLD.no_show_count
    OR NEW.blocked IS DISTINCT FROM OLD.blocked
  ) THEN
    RAISE EXCEPTION 'Only admin can change role, trusted, no_show_count or blocked';
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_fields
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_fields();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- No INSERT policy: rows are created only by the trigger above.
-- No DELETE policy: rows go away with the auth user (ON DELETE CASCADE).

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own profile or admin"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Update own profile or admin"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ============================================================================
-- BACKFILL
-- ============================================================================
-- Users created before this migration (e.g. the existing admin account).

INSERT INTO profiles (id)
SELECT id FROM auth.users
ON CONFLICT (id) DO NOTHING;
