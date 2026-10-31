import { useEffect, useSyncExternalStore } from "react";
import {
  DeviceListError,
  listDevices,
  type DeviceList,
  type DeviceProblem,
} from "../lib/deviceApi";

// The admin's list of devices lives in one small shared store, like the sync health does. Switching tabs and
// coming back shows what was loaded straight away, and a new load updates it.
interface Snapshot {
  data: DeviceList | null;
  problem: DeviceProblem | null;
  fetchedAt: number | null;
  busy: boolean;
}

let snap: Snapshot = {
  data: null,
  problem: null,
  fetchedAt: null,
  busy: false,
};
const listeners = new Set<() => void>();

function set(patch: Partial<Snapshot>) {
  snap = { ...snap, ...patch };
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

let inFlight: Promise<void> | null = null;

export function loadDevices(): Promise<void> {
  inFlight ??= (async () => {
    try {
      const list = await listDevices();
      set({ data: list, problem: null, fetchedAt: Date.now() });
    } catch (e) {
      set({ problem: e instanceof DeviceListError ? e.problem : "failed" }); // what was loaded before stays on screen
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

export async function refreshDevices() {
  set({ busy: true });
  await loadDevices();
  set({ busy: false });
}

// Loads the list when the screen opens, and again every minute while it is open and visible
export function useDevices() {
  const state = useSyncExternalStore(
    subscribe,
    () => snap,
    () => snap,
  );

  useEffect(() => {
    void loadDevices();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadDevices();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return { ...state, refresh: refreshDevices };
}

// The time, rounded to the half minute, so "updated 2 minutes ago" keeps itself right.
// (The time is read inside the store's own callbacks, never while a component is drawing itself.)
const subscribeClock = (onChange: () => void) => {
  const timer = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(timer);
};
const readClock = () => Math.floor(Date.now() / 30_000) * 30_000;
export const useClock = () =>
  useSyncExternalStore(subscribeClock, readClock, () => 0);
