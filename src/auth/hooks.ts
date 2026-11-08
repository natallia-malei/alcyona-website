import { useContext } from "react";
import type { Profile } from "../types";
import { AuthContext } from "./AuthContext";

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("Auth hooks must be used within <AuthProvider>");
  return ctx;
}

export function useSession() {
  return useAuth().session;
}

export function useIsAuthenticated(): boolean {
  return useAuth().session !== null;
}

export function useAuthLoading(): boolean {
  return useAuth().loading;
}

export function useProfile(): Profile | null {
  return useAuth().profile;
}

// Only admins see inline editing on the site (RLS enforces the same on the DB side)
export function useIsAdmin(): boolean {
  return useAuth().profile?.role === "admin";
}

// Who may see and use the studio (018): approved renters, the band, the admin.
// The database checks the same (has_studio_access).
export function hasStudioAccess(profile: Pick<Profile, "role"> | null): boolean {
  return profile !== null && profile.role !== "applicant";
}

// The studio menu item: only for people with access
export function useHasStudioAccess(): boolean {
  return hasStudioAccess(useAuth().profile);
}

// Band members and the admin (017): no booking limits, name-only profile, no consent
export function isTeam(profile: Pick<Profile, "role">): boolean {
  return profile.role === "member" || profile.role === "admin";
}

// Name for everyone; the phone only for clients (same rule as create_booking)
export function isProfileComplete(profile: Profile): boolean {
  const required = isTeam(profile)
    ? [profile.firstName, profile.lastName]
    : [profile.firstName, profile.lastName, profile.phone];
  return required.every((v) => v.trim() !== "");
}

// Complete + consent to personal data processing — required to book (013).
// The team needs no consent (the admin is the data operator), same as in create_booking.
export function isProfileReady(profile: Profile): boolean {
  return isProfileComplete(profile) && (isTeam(profile) || profile.privacyConsentAt !== null);
}

export interface Account {
  name: string; // "First Last", or email until the profile is filled in
  email: string;
  avatarUrl: string | null; // Google photo; null → initials
  initials: string;
}

// What the header shows for the signed-in user
export function useAccount(): Account | null {
  const { session, profile } = useAuth();
  if (!session) return null;

  const email = session.user.email ?? "";
  const meta = session.user.user_metadata as { avatar_url?: string; picture?: string };
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  const initials = fullName
    ? fullName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
    : email.slice(0, 1);

  return {
    name: fullName || email,
    email,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
    initials: initials.slice(0, 2).toUpperCase(),
  };
}

export function useAuthActions() {
  const {
    signInWithPassword,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  } = useAuth();
  return {
    signInWithPassword,
    signInWithMagicLink,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };
}
