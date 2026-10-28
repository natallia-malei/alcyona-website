import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile, ProfileInput } from "../types";
import { supabase } from "../supabase/client";
import { fetchProfile } from "../supabase/queries";
import { updateProfile as updateProfileMutation } from "../supabase/mutations";
import { AuthContext, type AuthContextValue } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

// Profile is stored together with the user it was loaded for, so after
// sign-out / user switch a stale profile is never shown.
interface LoadedProfile {
  userId: string;
  profile: Profile | null;
}

// Magic link and Google return the user to `next` (the page they came from);
// the onboarding form opens there if the profile isn't filled in yet.
// Supabase → Auth → URL Configuration must allow "<origin>/**", otherwise
// it falls back to the Site URL (landing page).
const redirectTo = (next: string) => new URL(next, window.location.origin).toString();

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  // Loaded in a separate effect, not inside onAuthStateChange:
  // calling Supabase from that callback can deadlock the auth client.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchProfile(userId)
      .catch((e: unknown) => {
        console.error("Failed to load profile", e);
        return null;
      })
      .then((profile) => {
        if (!cancelled) setLoaded({ userId, profile });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const profile = userId && loaded?.userId === userId ? loaded.profile : null;
  const profileLoading = userId !== null && loaded?.userId !== userId;

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithMagicLink = useCallback(async (email: string, next: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo(next) },
    });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async (next: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo(next) },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const updateProfile = useCallback(
    async (input: ProfileInput) => {
      if (!userId) throw new Error("Not signed in");
      const next = await updateProfileMutation(userId, input);
      setLoaded({ userId, profile: next });
    },
    [userId],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading: sessionLoading || profileLoading,
      signInWithPassword,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      updateProfile,
    }),
    [
      session,
      profile,
      sessionLoading,
      profileLoading,
      signInWithPassword,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
