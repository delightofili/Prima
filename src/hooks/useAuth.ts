import { createContext, useContext } from "react";
import type { LocalAccount, Role } from "../lib/auth";
import type { FacilityInfo } from "../lib/config";

export interface CreateFacilityInput {
  name: string;
  code: string;
  lga: string;
  state: string;
}

// Someone has signed up (or tried to sign in) but has not confirmed their email address yet.
// sentAt is when the last email was sent, or null if none was just sent (so "send a new email" is allowed at once).
export interface AwaitingEmail {
  email: string;
  sentAt: number | null;
}

export interface AuthState {
  status: "loading" | "signedOut" | "needsFacility" | "ready";
  account: LocalAccount | null;
  facility: FacilityInfo | null;
  role: Role | null;
  pendingEmail: string | null;
  cloudOk: boolean;
  notice: string | null;
  awaiting: AwaitingEmail | null;
  showForgot: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  createFacility: (input: CreateFacilityInput) => Promise<void>;
  joinFacility: (code: string) => Promise<void>;
  refreshFacility: () => Promise<void>;
  signOut: () => Promise<void>;
  eraseAndSignOut: () => Promise<void>;
  openForgot: () => void;
  backToSignIn: () => void;
  continueAfterEmail: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
