import { createContext, useContext } from "react";
import type { PinRecord } from "../lib/pin";

export interface LockState {
  lockNow: () => void;
  minutes: number;
  setMinutes: (m: number) => void;
  pin: PinRecord | null;
  savePin: (rec: PinRecord) => Promise<void>;
}

export const LockContext = createContext<LockState | null>(null);

export function useLock(): LockState {
  const v = useContext(LockContext);
  if (!v) throw new Error("useLock must be used inside SecurityGate");
  return v;
}
