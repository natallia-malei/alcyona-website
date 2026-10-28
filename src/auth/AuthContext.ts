import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile, ProfileInput } from "../types";

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string, next: string) => Promise<void>;
  signInWithGoogle: (next: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
