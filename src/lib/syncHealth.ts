import { useSyncExternalStore } from "react";
import type { ErrorKind } from "./syncErrors";

export const LIMIT_TAG = "PLAN_LIMIT";
export const SCHEMA_TAG = "DB_OUT_OF_DATE";

export interface SyncProblem {
  kind: ErrorKind | "pull";
  where: string; // the table or step
  message: string;
  at: number;
}

interface Health {
  failures: number; // consecutive network failures
  lastOkAt: number | null;
  working: number; // how many uploads or downloads are running right now
  nextRetryAt: number | null; // when the soonest waiting record will be tried again
  schemaProblem: string | null; // the cloud database is missing something the app needs
  problem: SyncProblem | null; // the most recent trouble, for the Sync Doctor page
  stalledAt: number | null; // a request hung and was given up on
}

let state: Health = {
  failures: 0,
  lastOkAt: null,
  working: 0,
  nextRetryAt: null,
  schemaProblem: null,
  problem: null,
  stalledAt: null,
};
const listeners = new Set<() => void>();

function set(patch: Partial<Health>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const markOk = () =>
  set({ failures: 0, lastOkAt: Date.now(), stalledAt: null });
export const markNetworkFail = () => set({ failures: state.failures + 1 });
export const beginWork = () => set({ working: state.working + 1 });
export const endWork = () => set({ working: Math.max(0, state.working - 1) });
export const resetWork = () => set({ working: 0 });
export const setNextRetry = (at: number | null) => {
  if (at !== state.nextRetryAt) set({ nextRetryAt: at });
};
export const setSchemaProblem = (detail: string | null) =>
  set({ schemaProblem: detail });
export const recordProblem = (problem: SyncProblem | null) => set({ problem });
export const markStalled = () =>
  set({ stalledAt: Date.now(), failures: state.failures + 1 });

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const useSyncHealth = () => useSyncExternalStore(subscribe, () => state);
export const getSyncHealth = () => state;

// Raw server text frightens people. This is what a nurse reads instead.
export function friendlySyncError(raw?: string): string {
  if (!raw) return "";
  if (import.meta.env.DEV) return raw;
  if (raw.startsWith(LIMIT_TAG))
    return "Waiting for a plan upgrade. The record is safe on this phone.";
  if (raw.startsWith(SCHEMA_TAG))
    return "The cloud database needs an update before this can upload. Tell your admin. The record is safe on this phone.";
  if (raw.startsWith("BUG:"))
    return "Prima hit a problem with this record. It is safe on this phone. Tell support.";
  if (raw.startsWith("PERMISSION:"))
    return "The cloud did not allow this record. It is safe on this phone. Tell your admin.";
  if (
    /failed to fetch|network|load failed|timeout|timed out|abort|unavailable|gateway|paused/i.test(
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
