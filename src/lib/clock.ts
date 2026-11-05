// Is this phone's clock right? Measured against the server, so a nurse can be told, because a wrong clock puts wrong dates on
// visits and reminders, and a phone set far behind has its changes ignored by the cloud ("newest wins" cannot be trusted).
import { supabase } from "./supabase";

export const WARN_MS = 5 * 60_000; // phones more than 10 minutes apart refuse to sync with each other, so warn well before that
export const MAX_ROUND_TRIP_MS = 10_000; // a slow answer says too little about the real time to be used
const KEY = "prima_clock";
const RECHECK_MS = 60_000; // never ask the server more than once a minute

export interface Reading {
  skewMs: number; // the phone's clock minus the real time: positive means the phone is ahead
  at: number; // when it was measured (on the phone's own clock)
}

// The phone's clock at the middle of the request, against what the server said. Null when the measurement cannot be trusted.
export function skewFrom(
  sentAt: number,
  serverMs: number,
  receivedAt: number,
): number | null {
  if (
    !Number.isFinite(sentAt) ||
    !Number.isFinite(serverMs) ||
    !Number.isFinite(receivedAt)
  )
    return null;
  if (receivedAt < sentAt || receivedAt - sentAt > MAX_ROUND_TRIP_MS)
    return null;
  return Math.round((sentAt + receivedAt) / 2 - serverMs);
}

export const isWrong = (skewMs: number) => Math.abs(skewMs) >= WARN_MS;

export type Unit = "minutes" | "hours" | "days";
export function describe(skewMs: number): {
  direction: "ahead" | "behind";
  unit: Unit;
  n: number;
} {
  const minutes = Math.abs(skewMs) / 60_000;
  const direction = skewMs >= 0 ? "ahead" : "behind";
  if (minutes < 90)
    return { direction, unit: "minutes", n: Math.max(1, Math.round(minutes)) };
  if (minutes < 36 * 60)
    return { direction, unit: "hours", n: Math.round(minutes / 60) };
  return { direction, unit: "days", n: Math.round(minutes / 1440) };
}

/* ---------- what the phone remembers ---------- */
let raw: string | null | undefined; // the last text read, so the same reading is the same object (React asks again and again)
let cached: Reading | null = null;
const listeners = new Set<() => void>();

export function getReading(): Reading | null {
  let text: string | null;
  try {
    text = localStorage.getItem(KEY);
  } catch {
    return cached; // storage blocked: the last reading made in this session, if any
  }
  if (text === raw) return cached;
  raw = text;
  try {
    const v = JSON.parse(text ?? "null") as Partial<Reading> | null;
    cached =
      v && Number.isFinite(v.skewMs) && Number.isFinite(v.at)
        ? { skewMs: v.skewMs as number, at: v.at as number }
        : null;
  } catch {
    cached = null;
  }
  return cached;
}
export const subscribeClock = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};
const announce = () => listeners.forEach((l) => l());

type Rpc = (
  name: string,
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
const defaultRpc: Rpc = (name) => supabase.rpc(name);

let lastTried = 0;

// Asks the server what time it is and remembers how far the phone is from it. Returns the reading, or null if it could not be made.
export async function measureClock(
  options: { force?: boolean; rpc?: Rpc; now?: () => number } = {},
): Promise<Reading | null> {
  const now = options.now ?? Date.now;
  const rpc = options.rpc ?? defaultRpc;
  if (!options.force && now() - lastTried < RECHECK_MS) return getReading();
  lastTried = now();
  const sentAt = now();
  try {
    const { data, error } = await rpc("server_time");
    const receivedAt = now();
    if (error || typeof data !== "string") return null;
    const skewMs = skewFrom(sentAt, Date.parse(data), receivedAt);
    if (skewMs === null) return null;
    const reading: Reading = { skewMs, at: receivedAt };
    cached = reading;
    try {
      localStorage.setItem(KEY, JSON.stringify(reading));
    } catch {
      /* storage blocked: the reading still counts for this session */
    }
    raw = undefined; // read it back next time, whatever happened
    announce();
    return reading;
  } catch {
    return null; // no signal: whatever was known before stays
  }
}

export function resetClockForTests() {
  raw = undefined;
  cached = null;
  lastTried = 0;
}
