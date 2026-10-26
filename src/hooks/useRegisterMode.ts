import { useState } from "react";

const KEY = "prima_register_mode";
export type RegisterMode = "quick" | "full";

// Which registration form this phone opens. Quick unless someone chooses the full form.
export function useRegisterMode(): [RegisterMode, (m: RegisterMode) => void] {
  const [mode, setMode] = useState<RegisterMode>(() => {
    try {
      return localStorage.getItem(KEY) === "full" ? "full" : "quick";
    } catch {
      return "quick";
    }
  });
  const change = (m: RegisterMode) => {
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* storage unavailable */
    }
    setMode(m);
  };
  return [mode, change];
}
