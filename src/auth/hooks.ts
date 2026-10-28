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

export function isProfileComplete(profile: Profile): boolean {
  return [profile.firstName, profile.lastName, profile.phone].every((v) => v.trim() !== "");
}

export function useAuthActions() {
  const { signInWithPassword, signInWithMagicLink, signInWithGoogle, signOut, updateProfile } =
    useAuth();
  return { signInWithPassword, signInWithMagicLink, signInWithGoogle, signOut, updateProfile };
}
