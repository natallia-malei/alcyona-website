import { useContext } from "react";
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

export function useAuthActions() {
  const { signIn, signOut } = useAuth();
  return { signIn, signOut };
}
