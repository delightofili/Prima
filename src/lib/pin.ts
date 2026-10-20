import { db } from "../db";

export interface PinRecord {
  userId: string;
  salt: string;
  hash: string;
  iterations: number;
  createdAt: number;
}

export interface Guard {
  fails: number;
  until: number; // timestamp: no tries before this moment
  reset: boolean; // too many failures: the password is required
}

export const PIN_LENGTH = 6;
export const AUTOLOCK_CHOICES = [1, 2, 5, 15] as const;

const PIN_KEY = "pin";
const GUARD_KEY = "prima_pin_guard";
const AUTOLOCK_KEY = "prima_autolock";
const ITERATIONS = 120_000;

const enc = new TextEncoder();
const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function createPin(
  pin: string,
  userId: string,
): Promise<PinRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  return {
    userId,
    salt: toB64(salt),
    hash: toB64(hash),
    iterations: ITERATIONS,
    createdAt: Date.now(),
  };
}

export async function verifyPin(pin: string, rec: PinRecord): Promise<boolean> {
  const got = await derive(pin, fromB64(rec.salt), rec.iterations);
  const want = fromB64(rec.hash);
  if (got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ want[i]; // no early exit: same time for every guess
  return diff === 0;
}

export function weakReason(pin: string): string | null {
  if (/^(\d)\1+$/.test(pin)) return "Do not repeat the same digit.";
  if ("0123456789".includes(pin) || "9876543210".includes(pin))
    return "Do not use numbers in order.";
  return null;
}

export async function readPin(): Promise<PinRecord | null> {
  const row = await db.meta.get(PIN_KEY);
  try {
    return row ? (JSON.parse(row.value) as PinRecord) : null;
  } catch {
    return null;
  }
}
export const writePin = (rec: PinRecord) =>
  db.meta.put({ key: PIN_KEY, value: JSON.stringify(rec) });
export const clearPin = () => db.meta.delete(PIN_KEY);

/* ---------- wrong-PIN delays ---------- */
export function readGuard(): Guard {
  try {
    return JSON.parse(localStorage.getItem(GUARD_KEY) ?? "") as Guard;
  } catch {
    return { fails: 0, until: 0, reset: false };
  }
}
function saveGuard(g: Guard) {
  try {
    localStorage.setItem(GUARD_KEY, JSON.stringify(g));
  } catch {
    /* storage unavailable */
  }
}
export const resetGuard = () => saveGuard({ fails: 0, until: 0, reset: false });

export function recordFailure(): Guard {
  const fails = readGuard().fails + 1;
  const waitSeconds = fails < 5 ? 0 : Math.min(900, 30 * 2 ** (fails - 5)); // 30s, 60s, 2m ... up to 15 min
  const next = {
    fails,
    until: Date.now() + waitSeconds * 1000,
    reset: fails >= 10,
  };
  saveGuard(next);
  return next;
}

/* ---------- auto-lock minutes (a preference of this phone) ---------- */
export function readAutoLock(): number {
  const n = Number(localStorage.getItem(AUTOLOCK_KEY));
  return (AUTOLOCK_CHOICES as readonly number[]).includes(n) ? n : 2;
}
export const saveAutoLock = (minutes: number) =>
  localStorage.setItem(AUTOLOCK_KEY, String(minutes));
