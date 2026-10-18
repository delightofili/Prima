import { createContext, useContext } from "react";
import type { LocalAccount, Role } from "../lib/auth";
import type { FacilityInfo } from "../lib/config";

export interface CreateFacilityInput {
  name: string;
  code: string;
  lga: string;
  state: string;
}

export interface AuthState {
  status: "loading" | "signedOut" | "needsFacility" | "ready";
  account: LocalAccount | null;
  facility: FacilityInfo | null;
  role: Role | null;
  pendingEmail: string | null;
  cloudOk: boolean;
  notice: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  createFacility: (input: CreateFacilityInput) => Promise<void>;
  joinFacility: (code: string) => Promise<void>;
  refreshFacility: () => Promise<void>;
  signOut: () => Promise<void>;
  eraseAndSignOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
