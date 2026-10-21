import { useSyncExternalStore } from "react";

export const LIMIT_TAG = "PLAN_LIMIT";

interface Health {
  failures: number; // consecutive network failures
  lastOkAt: number | null;
}

let state: Health = { failures: 0, lastOkAt: null };
const listeners = new Set<() => void>();

function set(next: Health) {
  state = next;
  listeners.forEach((l) => l());
}

export const markOk = () => set({ failures: 0, lastOkAt: Date.now() });
export const markNetworkFail = () =>
  set({ ...state, failures: state.failures + 1 });

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
export const useSyncHealth = () => useSyncExternalStore(subscribe, () => state);

// Raw server text frightens people. This is what a nurse reads instead.
export function friendlySyncError(raw?: string): string {
  if (!raw) return "";
  if (import.meta.env.DEV) return raw;
  if (raw.startsWith(LIMIT_TAG))
    return "Waiting for a plan upgrade. The record is safe on this phone.";
  if (
    /failed to fetch|network|load failed|timeout|unavailable|gateway|paused/i.test(
      raw,
    )
  ) {
    return "No connection to the cloud. It will upload by itself.";
  }
  if (/sign in again|jwt/i.test(raw)) return "Sign in again to keep syncing.";
  if (/foreign key/i.test(raw))
    return "Waiting for a related record to upload first.";
  return "The cloud did not accept this record yet. It stays safe on this phone. Tap Retry now.";
}
