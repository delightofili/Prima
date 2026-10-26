import { useSyncExternalStore } from "react";

export type PowerMode = "auto" | "on" | "off";

// Low Battery Mode turns on at 20% and off again at 30% (or when charging starts), so it does not flicker at 20%.
export function nextActive(
  wasActive: boolean,
  mode: PowerMode,
  level: number | null,
  charging: boolean | null,
): boolean {
  if (mode === "on") return true;
  if (mode === "off") return false;
  if (level === null || charging === null) return false; // this phone cannot say, so stay normal
  if (charging) return false;
  return wasActive ? level < 0.3 : level <= 0.2;
}

/* ---------- the live state, shared by the whole app ---------- */

const KEY = "prima_power_mode";

// The battery information Chrome on Android offers. Safari and Firefox do not have it.
interface BatteryManager extends EventTarget {
  level: number; // 0 to 1
  charging: boolean;
}

export interface PowerState {
  mode: PowerMode;
  level: number | null;
  charging: boolean | null;
  supported: boolean; // can this phone report its battery at all?
  active: boolean; // is Low Battery Mode on right now?
}

function readMode(): PowerMode {
  try {
    const v = localStorage.getItem(KEY);
    return v === "on" || v === "off" ? v : "auto";
  } catch {
    return "auto";
  }
}

let state: PowerState = {
  mode: readMode(),
  level: null,
  charging: null,
  supported: false,
  active: false,
};
const listeners = new Set<() => void>();
const ended = new Set<() => void>();

function update(patch: Partial<PowerState>) {
  const was = state.active;
  const next = { ...state, ...patch };
  next.active = nextActive(was, next.mode, next.level, next.charging);
  state = next;
  if (next.active) document.documentElement.dataset.power = "low";
  else delete document.documentElement.dataset.power;
  listeners.forEach((l) => l());
  if (was && !next.active) ended.forEach((cb) => cb()); // time to catch up on syncing
}

export function initPower() {
  update({});
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<BatteryManager>;
  };
  if (!nav.getBattery) return;
  void nav
    .getBattery()
    .then((b) => {
      const read = () =>
        update({ level: b.level, charging: b.charging, supported: true });
      read();
      b.addEventListener("levelchange", read);
      b.addEventListener("chargingchange", read);
    })
    .catch(() => undefined);
}

export function setPowerMode(mode: PowerMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* storage unavailable */
  }
  update({ mode });
}

// For code that is not a React component (the sync engine)
export const isPowerSaving = () => state.active;

export function onPowerSavingEnd(cb: () => void) {
  ended.add(cb);
  return () => {
    ended.delete(cb);
  };
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
export const usePower = () => useSyncExternalStore(subscribe, () => state);
